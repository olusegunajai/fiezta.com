import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Sparkles, 
  Save, 
  Plus, 
  Check, 
  Trash2, 
  RefreshCw, 
  Layout, 
  Type, 
  MousePointer2,
  Circle,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  Settings2,
  Loader2,
  History,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Theme } from '../types';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { GoogleGenAI, Type as SchemaType } from "@google/genai";

interface ThemeManagerProps {
  agencyId: string;
}

const DEFAULT_THEME_CONFIG = {
  primaryColor: '#6366f1',
  secondaryColor: '#4f46e5',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  fontFamily: 'Inter',
  borderRadius: '12px',
  glassmorphism: false
};

export const ThemeManager: React.FC<ThemeManagerProps> = ({ agencyId }) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: { ...DEFAULT_THEME_CONFIG },
    isAdminTheme: false
  });

  useEffect(() => {
    const q = query(collection(db, 'themes'), where('agencyId', '==', agencyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedThemes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Theme));
      setThemes(fetchedThemes);
      setActiveTheme(fetchedThemes.find(t => t.isActive && !t.isAdminTheme) || null);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'themes'));
    return () => unsubscribe();
  }, [agencyId]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const themeData = {
      ...formData,
      agencyId,
      isActive: editingTheme?.isActive || false,
      createdAt: editingTheme?.createdAt || new Date().toISOString()
    };

    try {
      if (editingTheme) {
        await updateDoc(doc(db, 'themes', editingTheme.id), themeData);
      } else {
        await addDoc(collection(db, 'themes'), themeData);
      }
      setIsModalOpen(false);
      setEditingTheme(null);
      setFormData({ name: '', description: '', config: { ...DEFAULT_THEME_CONFIG }, isAdminTheme: false });
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const handleActivate = async (themeId: string, isAdmin: boolean) => {
    try {
      const batch = writeBatch(db);
      
      // Deactivate current active theme of same type
      const currentActive = themes.find(t => t.isActive && t.isAdminTheme === isAdmin);
      if (currentActive) {
        batch.update(doc(db, 'themes', currentActive.id), { isActive: false });
      }

      // Activate new theme
      batch.update(doc(db, 'themes', themeId), { isActive: true });
      
      await batch.commit();
    } catch (error) {
      console.error("Error activating theme:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this theme?")) {
      try {
        await deleteDoc(doc(db, 'themes', id));
      } catch (error) {
        console.error("Error deleting theme:", error);
      }
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a professional UI theme configuration based on this prompt: "${aiPrompt}". 
        Return ONLY a JSON object with these fields: primaryColor, secondaryColor, accentColor, backgroundColor, textColor, fontFamily, borderRadius (e.g. "12px"), glassmorphism (boolean).
        The theme should be modern, accessible, and high-end.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              primaryColor: { type: SchemaType.STRING },
              secondaryColor: { type: SchemaType.STRING },
              accentColor: { type: SchemaType.STRING },
              backgroundColor: { type: SchemaType.STRING },
              textColor: { type: SchemaType.STRING },
              fontFamily: { type: SchemaType.STRING },
              borderRadius: { type: SchemaType.STRING },
              glassmorphism: { type: SchemaType.BOOLEAN }
            },
            required: ["primaryColor", "secondaryColor", "accentColor", "backgroundColor", "textColor", "fontFamily", "borderRadius", "glassmorphism"]
          }
        }
      });

      const config = JSON.parse(response.text);
      setFormData({
        ...formData,
        name: `AI Generated: ${aiPrompt.slice(0, 20)}...`,
        config
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("AI Generation Error:", error);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Seed themes for the user request
  const seedThemes = async () => {
    if (!agencyId) {
      alert("Agency ID is not loaded yet. Please wait a moment.");
      return;
    }
    const batch = writeBatch(db);
    
    const themesToSeed = [
      {
        name: "Modern Minimalist",
        description: "Clean, high-contrast design with vibrant accents and generous spacing.",
        config: {
          primaryColor: '#4f46e5',
          secondaryColor: '#10b981',
          accentColor: '#f59e0b',
          backgroundColor: '#f8fafc',
          textColor: '#0f172a',
          fontFamily: 'Inter',
          borderRadius: '16px',
          glassmorphism: false
        }
      },
      {
        name: "Classic Elegance",
        description: "Timeless serif typography and a refined, muted color palette.",
        config: {
          primaryColor: '#1e293b',
          secondaryColor: '#475569',
          accentColor: '#94a3b8',
          backgroundColor: '#ffffff',
          textColor: '#1e293b',
          fontFamily: 'Playfair Display',
          borderRadius: '4px',
          glassmorphism: false
        }
      },
      {
        name: "Ultra Premium",
        description: "Luxury dark mode with gold accents and glassmorphism effects.",
        config: {
          primaryColor: '#0f172a',
          secondaryColor: '#1e293b',
          accentColor: '#d4af37',
          backgroundColor: '#020617',
          textColor: '#f8fafc',
          fontFamily: 'Montserrat',
          borderRadius: '12px',
          glassmorphism: true
        }
      },
      {
        name: "Basic Utility",
        description: "Simple, highly legible design focused on core functionality.",
        config: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          accentColor: '#ef4444',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          fontFamily: 'Inter',
          borderRadius: '8px',
          glassmorphism: false
        }
      },
      {
        name: "Nostalgic Retro",
        description: "Warm, vintage-inspired tones with playful rounded corners.",
        config: {
          primaryColor: '#ea580c',
          secondaryColor: '#ca8a04',
          accentColor: '#16a34a',
          backgroundColor: '#fff7ed',
          textColor: '#431407',
          fontFamily: 'Space Grotesk',
          borderRadius: '24px',
          glassmorphism: false
        }
      },
      {
        name: "Corporate Professional",
        description: "Trustworthy blue tones and sharp edges for a business-first feel.",
        config: {
          primaryColor: '#0369a1',
          secondaryColor: '#0c4a6e',
          accentColor: '#0ea5e9',
          backgroundColor: '#f0f9ff',
          textColor: '#082f49',
          fontFamily: 'Inter',
          borderRadius: '6px',
          glassmorphism: false
        }
      }
    ];

    try {
      themesToSeed.forEach(theme => {
        const ref = doc(collection(db, 'themes'));
        batch.set(ref, {
          ...theme,
          agencyId,
          isAdminTheme: false,
          isActive: false,
          createdAt: new Date().toISOString()
        });
      });

      await batch.commit();
      alert("6 new themes have been added to your collection!");
    } catch (error) {
      console.error("Error seeding themes:", error);
      alert("Failed to seed themes. Check console for details.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Theme Management</h1>
          <p className="text-slate-500 text-sm">Customize your agency's visual identity with AI-powered themes.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={seedThemes}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all"
          >
            <Zap size={20} />
            Seed Preset Themes
          </button>
          <button 
            onClick={() => {
              setEditingTheme(null);
              setFormData({ name: '', description: '', config: { ...DEFAULT_THEME_CONFIG }, isAdminTheme: false });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            <Plus size={20} />
            New Theme
          </button>
        </div>
      </div>

      {/* AI Creator Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Palette size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Sparkles className="text-amber-300" size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">AI Theme Creator</h2>
          </div>
          <p className="text-indigo-100 mb-8 text-lg">Describe the vibe you want for your site, and our AI will generate a complete color palette and design configuration for you.</p>
          
          <div className="flex gap-4">
            <input 
              type="text" 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. A luxury tropical resort with sunset colors and elegant typography"
              className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all backdrop-blur-md"
            />
            <button 
              onClick={handleAiGenerate}
              disabled={isAiGenerating || !aiPrompt}
              className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
              {isAiGenerating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
              Generate
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-[32px] animate-pulse" />
          ))
        ) : themes.map((theme) => (
          <motion.div 
            key={theme.id}
            layout
            className={cn(
              "bg-white rounded-[32px] border-2 p-6 transition-all group relative overflow-hidden",
              theme.isActive ? "border-indigo-600 shadow-xl shadow-indigo-50" : "border-slate-100 hover:border-slate-200"
            )}
          >
            {theme.isActive && (
              <div className="absolute top-4 right-4 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg">
                <Check size={14} />
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-16 h-16 rounded-2xl shadow-inner flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: theme.config.backgroundColor }}
              >
                <div className="absolute inset-0 flex flex-wrap">
                  <div className="w-1/2 h-1/2" style={{ backgroundColor: theme.config.primaryColor }} />
                  <div className="w-1/2 h-1/2" style={{ backgroundColor: theme.config.secondaryColor }} />
                  <div className="w-1/2 h-1/2" style={{ backgroundColor: theme.config.accentColor }} />
                  <div className="w-1/2 h-1/2" style={{ backgroundColor: theme.config.textColor }} />
                </div>
              </div>
              <div>
                <h3 className="font-black text-slate-900 tracking-tight">{theme.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {theme.isAdminTheme ? 'Admin Theme' : 'Client Theme'}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-2">
                {[theme.config.primaryColor, theme.config.secondaryColor, theme.config.accentColor, theme.config.backgroundColor].map((color, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm" style={{ backgroundColor: color }} />
                ))}
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">{theme.description || 'No description provided.'}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingTheme(theme);
                    setFormData({
                      name: theme.name,
                      description: theme.description || '',
                      config: theme.config,
                      isAdminTheme: theme.isAdminTheme
                    });
                    setIsModalOpen(true);
                  }}
                  className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <Settings2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(theme.id)}
                  className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              {!theme.isActive && (
                <button 
                  onClick={() => handleActivate(theme.id, theme.isAdminTheme)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  Activate
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Theme Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]"
            >
              {/* Sidebar / Form */}
              <div className="w-full md:w-[400px] border-r border-slate-100 overflow-y-auto p-8 bg-slate-50/50">
                <div className="mb-8">
                  <h2 className="text-2xl font-black tracking-tighter text-slate-900">
                    {editingTheme ? 'Edit Theme' : 'Create Theme'}
                  </h2>
                  <p className="text-slate-500 text-sm">Configure your theme settings below.</p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Theme Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Primary</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={formData.config.primaryColor}
                          onChange={(e) => setFormData({...formData, config: {...formData.config, primaryColor: e.target.value}})}
                          className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                        />
                        <input 
                          type="text" 
                          value={formData.config.primaryColor}
                          onChange={(e) => setFormData({...formData, config: {...formData.config, primaryColor: e.target.value}})}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secondary</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={formData.config.secondaryColor}
                          onChange={(e) => setFormData({...formData, config: {...formData.config, secondaryColor: e.target.value}})}
                          className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                        />
                        <input 
                          type="text" 
                          value={formData.config.secondaryColor}
                          onChange={(e) => setFormData({...formData, config: {...formData.config, secondaryColor: e.target.value}})}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Accent</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={formData.config.accentColor}
                          onChange={(e) => setFormData({...formData, config: {...formData.config, accentColor: e.target.value}})}
                          className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                        />
                        <input 
                          type="text" 
                          value={formData.config.accentColor}
                          onChange={(e) => setFormData({...formData, config: {...formData.config, accentColor: e.target.value}})}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Background</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={formData.config.backgroundColor}
                          onChange={(e) => setFormData({...formData, config: {...formData.config, backgroundColor: e.target.value}})}
                          className="w-12 h-12 rounded-xl border-0 p-0 cursor-pointer overflow-hidden"
                        />
                        <input 
                          type="text" 
                          value={formData.config.backgroundColor}
                          onChange={(e) => setFormData({...formData, config: {...formData.config, backgroundColor: e.target.value}})}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Font Family</label>
                    <select 
                      value={formData.config.fontFamily}
                      onChange={(e) => setFormData({...formData, config: {...formData.config, fontFamily: e.target.value}})}
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option>Inter</option>
                      <option>Playfair Display</option>
                      <option>Montserrat</option>
                      <option>Roboto Mono</option>
                      <option>Space Grotesk</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Layout size={18} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Admin Theme</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isAdminTheme: !formData.isAdminTheme})}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        formData.isAdminTheme ? "bg-indigo-600" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.isAdminTheme ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-300 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                    >
                      Save Theme
                    </button>
                  </div>
                </form>
              </div>

              {/* Preview Area */}
              <div className="flex-1 bg-slate-200 p-12 overflow-y-auto flex items-center justify-center">
                <div 
                  className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
                  style={{ 
                    backgroundColor: formData.config.backgroundColor,
                    fontFamily: formData.config.fontFamily,
                    color: formData.config.textColor,
                    borderRadius: formData.config.borderRadius
                  }}
                >
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between" style={{ borderColor: `${formData.config.textColor}10` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: formData.config.primaryColor }} />
                      <span className="text-xl font-black tracking-tighter">Preview App</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: formData.config.secondaryColor }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: formData.config.accentColor }} />
                    </div>
                  </div>
                  
                  <div className="p-12 space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-4xl font-black tracking-tight leading-none">The Future of Luxury Travel</h1>
                      <p className="text-lg opacity-70">Experience the world like never before with our premium concierge services tailored just for you.</p>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        className="px-8 py-4 rounded-2xl font-bold text-white shadow-xl"
                        style={{ backgroundColor: formData.config.primaryColor }}
                      >
                        Book Now
                      </button>
                      <button 
                        className="px-8 py-4 rounded-2xl font-bold border-2"
                        style={{ borderColor: formData.config.primaryColor, color: formData.config.primaryColor }}
                      >
                        Learn More
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {[1, 2].map(i => (
                        <div key={i} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50" style={{ borderColor: `${formData.config.textColor}10` }}>
                          <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center" style={{ backgroundColor: `${formData.config.accentColor}20`, color: formData.config.accentColor }}>
                            <Zap size={24} />
                          </div>
                          <h3 className="font-bold text-lg mb-2">Feature {i}</h3>
                          <p className="text-sm opacity-60">High-end details and premium components for your agency.</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
