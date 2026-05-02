import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings2, 
  ChevronUp, 
  ChevronDown,
  Layout,
  Type,
  Grid,
  MessageSquare,
  HelpCircle,
  Megaphone,
  Video
} from 'lucide-react';
import { PageBlock } from './BlockRenderer';

interface PageBuilderProps {
  value: PageBlock[];
  onChange: (value: PageBlock[]) => void;
}

export const PageBuilder: React.FC<PageBuilderProps> = ({ value = [], onChange }) => {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const addBlock = (type: PageBlock['type']) => {
    const newBlock: PageBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data: getDefaultData(type)
    };
    onChange([...value, newBlock]);
  };

  const getDefaultData = (type: PageBlock['type']) => {
    switch (type) {
      case 'hero': return { title: 'Headline', description: 'Enter subheadline...', buttonLabel: 'Learn More', tagline: 'NEW COLLECTION' };
      case 'grid': return { title: 'Our Offerings', subtitle: 'Explore our elite selection...', items: [{ title: 'Service 1', description: 'Desc...' }], columns: 3 };
      case 'content': return { html: '<p>Standard text block...</p>' };
      case 'video': return { title: 'Watch Video', duration: '5:00', thumbnail: '' };
      case 'faq': return { title: 'Questions?' };
      case 'cta': return { title: 'Start Today', description: 'Join the Fiezta world.', buttonLabel: 'Get Started' };
      default: return {};
    }
  };

  const removeBlock = (id: string) => {
    onChange(value.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newValue = [...value];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= value.length) return;
    [newValue[index], newValue[targetIndex]] = [newValue[targetIndex], newValue[index]];
    onChange(newValue);
  };

  const updateBlockData = (id: string, field: string, val: any) => {
    onChange(value.map(b => b.id === id ? { ...b, data: { ...b.data, [field]: val } } : b));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-[32px] border border-slate-100">
        {[
          { type: 'hero', icon: Layout, label: 'Hero' },
          { type: 'grid', icon: Grid, label: 'Grid' },
          { type: 'content', icon: Type, label: 'Text' },
          { type: 'video', icon: Video, label: 'Video' },
          { type: 'faq', icon: HelpCircle, label: 'FAQ' },
          { type: 'cta', icon: Megaphone, label: 'CTA' }
        ].map((btn, idx) => (
          <button 
            key={`${btn.type}-${idx}`}
            onClick={() => addBlock(btn.type as any)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all shadow-sm"
          >
            <btn.icon size={14} />
            {btn.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {value.map((block, index) => (
          <div key={block.id} className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm group">
            <div className="flex items-center justify-between p-4 px-6 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <GripVertical size={16} className="text-slate-300 cursor-move" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] bg-white px-3 py-1 rounded-full border border-amber-100">
                  {block.type}
                </span>
                <span className="text-sm font-bold text-slate-800">{block.data.title || block.data.html?.substring(0, 30) || 'Untitled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30"><ChevronUp size={16} /></button>
                <button onClick={() => moveBlock(index, 'down')} disabled={index === value.length - 1} className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30"><ChevronDown size={16} /></button>
                <button 
                  onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                  className="p-2 text-[#D4AF37] hover:bg-amber-50 rounded-xl transition-all"
                >
                  <Settings2 size={16} />
                </button>
                <button onClick={() => removeBlock(block.id)} className="p-2 text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            </div>

            {editingBlockId === block.id && (
              <div className="p-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(block.data).map((key, idx) => (
                  <div key={`${key}-${idx}`} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</label>
                    {key === 'html' || key === 'description' ? (
                      <textarea 
                        value={block.data[key]}
                        onChange={(e) => updateBlockData(block.id, key, e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        rows={3}
                      />
                    ) : (
                      <input 
                        type="text"
                        value={block.data[key]}
                        onChange={(e) => updateBlockData(block.id, key, e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {value.length === 0 && (
          <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[48px]">
            <Layout size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Add your first section to start building.</p>
          </div>
        )}
      </div>
    </div>
  );
};
