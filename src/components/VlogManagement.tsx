import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Eye, 
  Edit2, 
  Trash2, 
  Video,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Tag,
  ExternalLink
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Vlog } from '../types';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

interface VlogManagementProps {
  agencyId: string;
}

export const VlogManagement: React.FC<VlogManagementProps> = ({ agencyId }) => {
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVlog, setEditingVlog] = useState<Vlog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    category: 'Travel Tips',
    status: 'draft' as 'published' | 'draft',
    tags: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'vlogs'), where('agencyId', '==', agencyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vlog)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'vlogs'));
    return () => unsubscribe();
  }, [agencyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const vlogData = {
      ...formData,
      agencyId,
      tags: formData.tags.split(',').map(t => t.trim()),
      views: editingVlog?.views || 0,
      publishedAt: formData.status === 'published' ? new Date().toISOString() : '',
      createdAt: editingVlog?.createdAt || new Date().toISOString()
    };

    try {
      if (editingVlog) {
        await updateDoc(doc(db, 'vlogs', editingVlog.id), vlogData);
      } else {
        await addDoc(collection(db, 'vlogs'), vlogData);
      }
      setIsModalOpen(false);
      setEditingVlog(null);
      setFormData({ title: '', description: '', videoUrl: '', thumbnailUrl: '', category: 'Travel Tips', status: 'draft', tags: '' });
    } catch (error) {
      console.error("Error saving vlog:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vlog?")) {
      try {
        await deleteDoc(doc(db, 'vlogs', id));
      } catch (error) {
        console.error("Error deleting vlog:", error);
      }
    }
  };

  const filteredVlogs = vlogs.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">Vlog Management</h1>
          <p className="text-slate-500 text-sm">Create and manage high-quality video content for your agency.</p>
        </div>
        <button 
          onClick={() => {
            setEditingVlog(null);
            setFormData({ title: '', description: '', videoUrl: '', thumbnailUrl: '', category: 'Travel Tips', status: 'draft', tags: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
        >
          <Plus size={20} />
          Create Vlog
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search vlogs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-3 hover:bg-white rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-200"><Filter size={18} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vlog</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Published</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-indigo-600 mb-2" size={32} />
                    <p className="text-slate-400 font-bold">Loading vlogs...</p>
                  </td>
                </tr>
              ) : filteredVlogs.length > 0 ? filteredVlogs.map((vlog) => (
                <tr key={vlog.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-12 rounded-lg bg-slate-100 overflow-hidden relative group-hover:shadow-md transition-all">
                        <img src={vlog.thumbnailUrl || 'https://picsum.photos/seed/vlog/200/120'} alt={vlog.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <Play size={16} className="text-white fill-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{vlog.title}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{vlog.videoUrl}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{vlog.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      vlog.status === 'published' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {vlog.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold text-sm">
                      <Eye size={14} className="text-slate-400" />
                      {vlog.views.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-500">
                      {vlog.publishedAt ? new Date(vlog.publishedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingVlog(vlog);
                          setFormData({
                            title: vlog.title,
                            description: vlog.description,
                            videoUrl: vlog.videoUrl,
                            thumbnailUrl: vlog.thumbnailUrl,
                            category: vlog.category,
                            status: vlog.status,
                            tags: vlog.tags.join(', ')
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(vlog.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-4">
                      <Video size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold">No vlogs found.</p>
                    <p className="text-sm text-slate-400 mt-1">Start by creating your first video content.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-none sm:rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]"
            >
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900">
                    {editingVlog ? 'Edit Vlog' : 'Create New Vlog'}
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm">Fill in the details for your video content.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 sm:p-3 hover:bg-slate-200 rounded-2xl transition-colors"
                >
                  <MoreVertical size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Vlog Title</label>
                    <input 
                      required
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. 10 Best Hidden Gems in Bali"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option>Travel Tips</option>
                      <option>Destination Guide</option>
                      <option>Luxury Experience</option>
                      <option>Vlog Series</option>
                      <option>Agency News</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Briefly describe what this vlog is about..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Video URL</label>
                    <div className="relative">
                      <Play className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required
                        type="url" 
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                        placeholder="YouTube or Vimeo link"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Thumbnail URL</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="url" 
                        value={formData.thumbnailUrl}
                        onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                        placeholder="Image URL"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tags (comma separated)</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={formData.tags}
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                        placeholder="bali, travel, luxury"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                    <div className="flex gap-4">
                      {['draft', 'published'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({...formData, status: s as any})}
                          className={cn(
                            "flex-1 py-4 rounded-2xl font-bold text-sm transition-all border capitalize",
                            formData.status === s 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                              : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                  >
                    {editingVlog ? 'Update Vlog' : 'Create Vlog'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
