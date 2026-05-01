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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X
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
import { logActivity } from '../lib/security';

interface VlogManagementProps {
  agencyId: string;
  profile?: any;
}

export const VlogManagement: React.FC<VlogManagementProps> = ({ agencyId, profile }) => {
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingVlog, setEditingVlog] = useState<Vlog | null>(null);
  const [viewingVlog, setViewingVlog] = useState<Vlog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

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
        if (profile && agencyId) {
          await logActivity(agencyId, profile.uid, profile.displayName, 'DELETE', 'Vlog', id, `Deleted vlog`);
        }
        setSelectedIds(prev => prev.filter(i => i !== id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `vlogs/${id}`);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} vlogs?`)) {
      try {
        const promises = selectedIds.map(id => deleteDoc(doc(db, 'vlogs', id)));
        await Promise.all(promises);
        
        if (profile && agencyId) {
          await logActivity(agencyId, profile.uid, profile.displayName, 'BULK_DELETE', 'Vlog', 'multiple', `Deleted ${selectedIds.length} vlogs`);
        }
        
        setSelectedIds([]);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'vlogs');
      }
    }
  };

  const filteredVlogs = vlogs.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredVlogs.length / itemsPerPage);
  const paginatedVlogs = filteredVlogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">Vlog Management</h1>
          <p className="text-slate-500 text-sm">Create and manage high-quality video content for your agency.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <span className="text-sm font-bold text-indigo-600">{selectedIds.length} Selected</span>
              
              <select 
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  if (!newStatus) return;
                  if (window.confirm(`Update status to "${newStatus}" for ${selectedIds.length} vlogs?`)) {
                    try {
                      const promises = selectedIds.map(id => updateDoc(doc(db, 'vlogs', id), { status: newStatus as any }));
                      await Promise.all(promises);
                      setSelectedIds([]);
                    } catch (err) {
                      console.error("Bulk status update error:", err);
                    }
                  }
                }}
                className="text-xs font-bold bg-white border border-indigo-200 rounded-lg px-2 py-1 text-indigo-600 focus:outline-none"
              >
                <option value="">Bulk Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>

              <button 
                onClick={handleBulkDelete}
                className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all"
                title="Delete Selected"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
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
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredVlogs.length && filteredVlogs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredVlogs.map(v => v.id));
                      else setSelectedIds([]);
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
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
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-indigo-600 mb-2" size={32} />
                    <p className="text-slate-400 font-bold">Loading vlogs...</p>
                  </td>
                </tr>
              ) : paginatedVlogs.length > 0 ? paginatedVlogs.map((vlog) => (
                <tr 
                  key={vlog.id} 
                  className={cn(
                    "hover:bg-slate-50 transition-colors group cursor-pointer",
                    selectedIds.includes(vlog.id) && "bg-indigo-50/50"
                  )}
                  onClick={() => {
                    if (selectedIds.includes(vlog.id)) {
                      setSelectedIds(prev => prev.filter(id => id !== vlog.id));
                    } else {
                      setSelectedIds(prev => [...prev, vlog.id]);
                    }
                  }}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(vlog.id)}
                      onChange={() => {
                        if (selectedIds.includes(vlog.id)) {
                          setSelectedIds(prev => prev.filter(id => id !== vlog.id));
                        } else {
                          setSelectedIds(prev => [...prev, vlog.id]);
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingVlog(vlog);
                          setIsViewModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="View"
                      >
                        <Search size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
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
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(vlog.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
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

        {/* Pagination */}
        {filteredVlogs.length > 0 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 font-medium">
                Showing <span className="text-slate-900 font-bold">{Math.min(filteredVlogs.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredVlogs.length, currentPage * itemsPerPage)}</span> of <span className="text-slate-900 font-bold">{filteredVlogs.length}</span>
              </span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none"
              >
                <option value={4}>4 per page</option>
                <option value={6}>6 per page</option>
                <option value={12}>12 per page</option>
                <option value={24}>24 per page</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all rounded-xl border border-slate-200 bg-white"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                      currentPage === pageNum 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                        : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                    )}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all rounded-xl border border-slate-200 bg-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && viewingVlog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white sm:rounded-[40px] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30 shrink-0">
                <div>
                  <h2 className="text-2xl font-black tracking-tighter text-slate-900">
                    View Vlog
                  </h2>
                  <p className="text-slate-500 text-sm">Detailed video content insights.</p>
                </div>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-3 hover:bg-slate-200 rounded-2xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="aspect-video w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative group">
                  <img src={viewingVlog.thumbnailUrl} alt={viewingVlog.title} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <button className="w-20 h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                      <Play size={40} className="fill-indigo-600 ml-2" />
                    </button>
                    <a 
                      href={viewingVlog.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-black/40 backdrop-blur-md text-white rounded-full text-xs font-bold hover:bg-black/60 transition-all flex items-center gap-2"
                    >
                      <ExternalLink size={14} />
                      Open Original Video
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                    <Eye className="text-slate-400 mb-2" size={24} />
                    <span className="text-2xl font-black text-slate-900">{viewingVlog.views.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Views</span>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                    <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
                    <span className="text-2xl font-black text-slate-900 uppercase">{viewingVlog.status}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</span>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                    <Tag className="text-indigo-500 mb-2" size={24} />
                    <span className="text-lg font-black text-slate-900">{viewingVlog.category}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Vlog Description</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingVlog.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 font-medium">
                    {viewingVlog.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setEditingVlog(viewingVlog);
                    setFormData({
                      title: viewingVlog.title,
                      description: viewingVlog.description,
                      videoUrl: viewingVlog.videoUrl,
                      thumbnailUrl: viewingVlog.thumbnailUrl,
                      category: viewingVlog.category,
                      status: viewingVlog.status,
                      tags: viewingVlog.tags.join(', ')
                    });
                    setIsViewModalOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                >
                  Edit Vlog
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
