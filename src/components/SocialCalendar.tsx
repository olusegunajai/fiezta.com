import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  MoreVertical,
  Plus
} from 'lucide-react';
import { SocialPost, SocialPlatform } from '../types';
import { cn } from '../lib/utils';

interface SocialCalendarProps {
  posts: SocialPost[];
}

export const SocialCalendar: React.FC<SocialCalendarProps> = ({ posts }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[40px] border border-slate-100 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-10 gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">{monthName} {year}</h2>
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><ChevronLeft size={16} /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-1.5 bg-white text-slate-900 rounded-lg text-[10px] sm:text-xs font-bold shadow-sm">Month</button>
            <button className="flex-1 sm:flex-none px-4 py-1.5 text-slate-500 rounded-lg text-[10px] sm:text-xs font-bold">Week</button>
            <button className="flex-1 sm:flex-none px-4 py-1.5 text-slate-500 rounded-lg text-[10px] sm:text-xs font-bold">Day</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl sm:rounded-3xl overflow-hidden min-w-[700px]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
          <div key={`${day}-${idx}`} className="bg-slate-50 p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[140px]"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayPosts = posts.filter(p => {
            const postDate = new Date(p.scheduledAt);
            return postDate.getDate() === day && 
                   postDate.getMonth() === currentDate.getMonth() && 
                   postDate.getFullYear() === currentDate.getFullYear();
          });

          return (
            <div key={day} className="bg-white min-h-[140px] p-4 hover:bg-slate-50 transition-colors cursor-pointer group relative">
              <span className="text-sm font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{day}</span>
              
              <div className="mt-3 space-y-2">
                {dayPosts.map(post => (
                  <div key={post.id} className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2 group/post">
                    <div className="flex -space-x-1">
                      {post.platforms.map((p, platIdx) => (
                        <div key={`${p}-${platIdx}`} className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                          {p === 'facebook' && <Facebook size={8} className="text-blue-600" />}
                          {p === 'instagram' && <Instagram size={8} className="text-pink-600" />}
                          {p === 'x' && <Twitter size={8} className="text-slate-900" />}
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] font-bold text-indigo-700 truncate flex-1">{post.content}</p>
                    <Clock size={8} className="text-indigo-400" />
                  </div>
                ))}
              </div>

              <button className="absolute bottom-2 right-2 p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                <Plus size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  </motion.div>
  );
};
