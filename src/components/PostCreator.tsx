import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Calendar, 
  Image as ImageIcon, 
  Video, 
  Smartphone,
  MessageSquare,
  BarChart3,
  Globe,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Search,
  Filter,
  TrendingUp,
  Users,
  Eye,
  Share2,
  Heart,
  Send,
  Sparkles,
  Loader2,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Hash,
  AtSign,
  Smile,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { SocialAccount, SocialPost, SocialPlatform, TravelPackage } from '../types';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

interface PostCreatorProps {
  agencyId: string;
  accounts: SocialAccount[];
  onClose: () => void;
  onSuccess: () => void;
}

export const PostCreator: React.FC<PostCreatorProps> = ({ agencyId, accounts, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedPackage, setLinkedPackage] = useState<TravelPackage | null>(null);
  const [packages, setPackages] = useState<TravelPackage[]>([]);

  useEffect(() => {
    // Fetch packages for linking
    const q = query(collection(db, 'packages'), where('agencyId', '==', agencyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TravelPackage)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'packages'));
    return () => unsubscribe();
  }, [agencyId]);

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = linkedPackage 
        ? `Create a catchy social media post for a travel package titled "${linkedPackage.title}". Destinations: ${linkedPackage.destinations.join(', ')}. Price: $${linkedPackage.price}. Include hashtags and emojis. Optimize for ${selectedPlatforms.join(', ')}.`
        : `Create a catchy social media post about travel trends in 2026. Include hashtags and emojis. Optimize for ${selectedPlatforms.join(', ')}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        setContent(response.text);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const postData = {
        agencyId,
        content,
        platforms: selectedPlatforms,
        scheduledAt,
        mediaUrls,
        status: 'scheduled',
        type: 'post',
        packageId: linkedPackage?.id || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        analytics: { likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0 }
      };

      await addDoc(collection(db, 'social_posts'), postData);
      onSuccess();
    } catch (error) {
      console.error('Failed to schedule post:', error);
      handleFirestoreError(error, OperationType.CREATE, 'social_posts');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white sm:rounded-[40px] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Create New Post</h2>
            <p className="text-slate-500 text-xs sm:text-sm">Design and schedule your content across multiple platforms.</p>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 hover:bg-slate-200 rounded-xl sm:rounded-2xl transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Editor Side */}
            <div className="space-y-8">
              {/* Platform Selection */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Select Platforms</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
                    { id: 'x', icon: Twitter, color: 'text-slate-900', bg: 'bg-slate-100' },
                    { id: 'youtube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' }
                  ].map((p, idx) => (
                    <button
                      key={`${p.id}-${idx}`}
                      onClick={() => setSelectedPlatforms(prev => 
                        prev.includes(p.id as SocialPlatform) 
                          ? prev.filter(x => x !== p.id) 
                          : [...prev, p.id as SocialPlatform]
                      )}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
                        selectedPlatforms.includes(p.id as SocialPlatform)
                          ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm"
                          : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <p.icon size={18} className={selectedPlatforms.includes(p.id as SocialPlatform) ? p.color : ""} />
                      <span className="text-sm font-bold capitalize">{p.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Post Content</label>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    AI Assistant
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind? Use AI to generate captions..."
                    className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-3xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><Smile size={18} /></button>
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><AtSign size={18} /></button>
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><Hash size={18} /></button>
                  </div>
                </div>
              </div>

              {/* Media & Links */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Schedule For</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Link Package</label>
                  <select
                    value={linkedPackage?.id || ''}
                    onChange={(e) => setLinkedPackage(packages.find(p => p.id === e.target.value) || null)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">None</option>
                    {packages.map((p, idx) => (
                      <option key={`${p.id}-${idx}`} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview Side */}
            <div className="bg-slate-50 rounded-[32px] p-8 flex flex-col">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 block">Live Preview</label>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                  <div className="p-4 flex items-center gap-3 border-b border-slate-50">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Fiezta Travel</p>
                      <p className="text-[10px] text-slate-400">Just now • Sponsored</p>
                    </div>
                  </div>
                  {linkedPackage && (
                    <div className="aspect-video bg-slate-200 relative">
                      <img src={linkedPackage.image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-900">{linkedPackage.title}</p>
                          <p className="text-[10px] text-indigo-600 font-bold">From ${linkedPackage.price}</p>
                        </div>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold">Book Now</button>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {content || "Your post content will appear here..."}
                    </p>
                  </div>
                  <div className="p-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-400">
                      <Heart size={18} />
                      <MessageSquare size={18} />
                      <Send size={18} />
                    </div>
                    <BarChart3 size={18} className="text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Save as Draft
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !content || selectedPlatforms.length === 0}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Clock size={20} />}
                  Schedule Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
