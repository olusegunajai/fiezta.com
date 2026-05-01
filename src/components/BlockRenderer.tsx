import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ChevronRight, 
  Music, 
  Plane, 
  Car, 
  Home, 
  Mail, 
  Smartphone,
  Zap,
  CheckCircle2,
  Target,
  TrendingUp,
  Shield,
  Globe,
  User as UserIcon,
  Play
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export interface PageBlock {
  id: string;
  type: 'hero' | 'grid' | 'content' | 'testimonials' | 'faq' | 'cta' | 'video';
  data: any;
}

interface BlockRendererProps {
  block: PageBlock;
  reviews?: any[];
  faqs?: any[];
  onAction?: (action: string) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, reviews = [], faqs = [], onAction }) => {
  const { type, data } = block;

  switch (type) {
    case 'hero':
      return (
        <section className="relative py-24 lg:py-32 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-3xl">
              {data.tagline && <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] mb-4 block">{data.tagline}</span>}
              <h1 className="text-5xl lg:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.95]">
                {data.title || 'Dynamic Page'}
              </h1>
              <p className="text-xl text-slate-500 mb-10 leading-relaxed">
                {data.description}
              </p>
              {data.buttonLabel && (
                <button 
                  onClick={() => onAction?.(data.buttonAction)}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
                >
                  {data.buttonLabel} <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
          {data.backgroundImage && (
            <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block opacity-10 pointer-events-none">
              <img src={data.backgroundImage} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
            </div>
          )}
        </section>
      );

    case 'grid':
      return (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-black tracking-tighter text-slate-900 mb-4 uppercase">{data.title}</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">{data.subtitle}</p>
            </div>
            <div className={cn("grid gap-8", data.columns === 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
              {data.items?.map((item: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 bg-slate-50 rounded-[32px] border border-transparent hover:border-[#D4AF37] transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    {/* Hardcoded icons mapping for now or use data.icon if it's a string */}
                    <Sparkles className="text-[#D4AF37]" size={24} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'content':
      return (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6 prose prose-slate prose-lg lg:prose-xl" dangerouslySetInnerHTML={{ __html: data.html }}></div>
        </section>
      );

    case 'video':
      return (
        <section className="py-24 bg-slate-900 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="aspect-video w-full rounded-[40px] bg-slate-800 relative overflow-hidden group cursor-pointer border border-white/10">
              {data.thumbnail ? (
                <img src={data.thumbnail} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" alt="" referrerPolicy="no-referrer" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-transparent"></div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="text-slate-900 fill-slate-900" size={32} />
                </div>
              </div>
              <div className="absolute bottom-10 left-10">
                <h3 className="text-3xl font-black text-white mb-2">{data.title}</h3>
                <p className="text-white/60">{data.duration}</p>
              </div>
            </div>
          </div>
        </section>
      );

    case 'faq':
      return (
        <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-12 text-center">{data.title || 'FAQ'}</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-slate-900 mb-2">{faq.question}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'cta':
      return (
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-slate-900 rounded-[48px] p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-black text-white mb-8 leading-tight">{data.title}</h2>
              <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">{data.description}</p>
              <button 
                onClick={() => onAction?.(data.buttonAction)}
                className="px-10 py-5 bg-[#D4AF37] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-200"
              >
                {data.buttonLabel}
              </button>
            </div>
          </div>
        </section>
      );

    default:
      return <div className="p-10 border border-dashed border-slate-200 rounded-3xl m-6 text-slate-300 text-center">Unrecognized block type: {type}</div>;
  }
};
