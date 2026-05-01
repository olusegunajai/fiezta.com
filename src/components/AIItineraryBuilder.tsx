import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Users, 
  Coffee, 
  Plane, 
  Hotel, 
  ChevronRight, 
  Loader2, 
  ArrowRight,
  UtensilsCrossed,
  Palmtree,
  Save,
  Download,
  Share2,
  X
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

interface AIItineraryBuilderProps {
  user: UserProfile;
  onSave?: (itinerary: string) => void;
  onClose: () => void;
}

export const AIItineraryBuilder: React.FC<AIItineraryBuilderProps> = ({ user, onClose }) => {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('3');
  const [preferences, setPreferences] = useState('');
  const [travelType, setTravelType] = useState(user.preferences?.travelType || 'solo');
  const [budget, setBudget] = useState(user.preferences?.budget || 'mid-range');
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);

  const generateItinerary = async () => {
    if (!destination) return;
    setIsGenerating(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = 'gemini-3-flash-preview';

      const prompt = `
        Create a detailed travel itinerary for a ${duration}-day trip to ${destination}.
        Traveler details:
        - Type: ${travelType}
        - Budget: ${budget}
        - Preferences: ${preferences}
        - User's saved preferences: ${user.preferences?.destinations.join(', ')}

        The itinerary should include:
        1. A brief overview of the destination.
        2. Daily breakdown with morning, afternoon, and evening activities.
        3. Specific accommodation suggestions (at least 2 matching the budget).
        4. Specific dining suggestions (at least 3 local favorites).
        5. Practical travel tips (best way to get around, what to pack).
        
        Format the output nicely using Markdown with clear headings and bullet points.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      setItinerary(response.text || 'Failed to generate itinerary. Please try again.');
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setItinerary('An error occurred while generating your itinerary. Please check your connectivity.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white sm:rounded-[40px] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900">AI Journey Architect</h2>
              <p className="text-slate-500 text-xs sm:text-sm italic">Crafting your perfect escape with machine intelligence.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 sm:p-3 hover:bg-slate-200 rounded-xl sm:rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Builder Sidebar */}
          <div className="w-full md:w-80 border-r border-slate-100 p-6 space-y-6 overflow-y-auto custom-scrollbar shrink-0 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Where to?" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duration (Days)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number" 
                    min="1" 
                    max="14"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Travel Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {['solo', 'family', 'group', 'business'].map(type => (
                    <button
                      key={type}
                      onClick={() => setTravelType(type as any)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all border",
                        travelType === type 
                          ? "bg-indigo-600 text-white border-indigo-600" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Budget Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {['budget', 'mid-range', 'luxury'].map(tier => (
                    <button
                      key={tier}
                      onClick={() => setBudget(tier as any)}
                      className={cn(
                        "px-2 py-2 rounded-xl text-[10px] font-bold capitalize transition-all border",
                        budget === tier 
                          ? "bg-indigo-600 text-white border-indigo-600" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      )}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Special Preferences</label>
                <textarea 
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  placeholder="e.g. Vegetarian food, love historic sites, prefer walking..."
                  className="w-full p-4 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all h-32 resize-none font-medium"
                />
              </div>
            </div>

            <button 
              onClick={generateItinerary}
              disabled={isGenerating || !destination}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-400 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {isGenerating ? 'Building...' : 'Build Itinerary'}
            </button>
          </div>

          {/* Results Main Area */}
          <div className="flex-1 bg-slate-50/50 overflow-y-auto p-6 sm:p-10 custom-scrollbar relative">
            <AnimatePresence mode="wait">
              {!itinerary && !isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto"
                >
                  <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[32px] flex items-center justify-center mb-6 animate-pulse">
                    <Palmtree size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Ready to plan?</h3>
                  <p className="text-slate-500 text-sm leading-relaxed px-4">
                    Enter your dream destination and let our AI architect a bespoke timeline just for you.
                  </p>
                </motion.div>
              )}

              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center"
                >
                  <div className="relative mb-8">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Architecting your journey...</h3>
                  <p className="text-slate-500 text-sm">Searching for the best experiences in {destination}.</p>
                </motion.div>
              )}

              {itinerary && !isGenerating && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Generated Itinerary</span>
                      <h2 className="text-2xl font-black text-slate-900">{destination} Expedition</h2>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                        <Download size={20} />
                      </button>
                      <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                        <Share2 size={20} />
                      </button>
                      <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Save size={18} />
                        Save Plans
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-slate-100 shadow-sm prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
                    <ReactMarkdown>{itinerary}</ReactMarkdown>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 pb-10">
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[24px]">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm mb-4">
                        <UtensilsCrossed size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">Local Dining</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Top rated restaurants based on your preferences.</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-[24px]">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm mb-4">
                        <Hotel size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">Lodging</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Boutique and luxury stays within your budget.</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-[24px]">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm mb-4">
                        <Plane size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">Logistics</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Efficient routes and local transit guidance.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
