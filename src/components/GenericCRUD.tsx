import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Loader2,
  ChevronRight,
  ChevronLeft,
  Download,
  Upload,
  RefreshCw,
  Database,
  FileText,
  Settings,
  Shield,
  CheckCircle2,
  AlertCircle,
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
  doc,
  getDocs,
  orderBy,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface GenericCRUDProps {
  entityName: string;
  collectionName: string;
  agencyId: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'url' | 'hidden' | 'json' | 'image' | 'html';
    options?: string[];
    required?: boolean;
    hidden?: boolean;
    defaultValue?: any;
  }[];
  displayFields: string[];
  fixedFilters?: Record<string, any>;
}

export const GenericCRUD: React.FC<GenericCRUDProps> = ({ 
  entityName, 
  collectionName, 
  agencyId, 
  fields,
  displayFields,
  fixedFilters
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    let q = query(
      collection(db, collectionName), 
      where('agencyId', '==', agencyId)
    );

    if (fixedFilters) {
      Object.entries(fixedFilters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          q = query(q, where(field, 'in', value));
        } else {
          q = query(q, where(field, '==', value));
        }
      });
    }

    q = query(q, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, collectionName));
    
    return () => unsubscribe();
  }, [collectionName, agencyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemData = {
      ...formData,
      agencyId,
      updatedAt: new Date().toISOString(),
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), itemData);
      } else {
        await addDoc(collection(db, collectionName), itemData);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      console.error(`Error saving ${entityName}:`, error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${entityName}?`)) {
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (error) {
        console.error(`Error deleting ${entityName}:`, error);
      }
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">{entityName} Management</h1>
          <p className="text-slate-500 text-sm">Manage all your {entityName.toLowerCase()} records in one place.</p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={20} />
          </button>
          <button 
            onClick={() => {
              setEditingItem(null);
              const initialData: any = {};
              fields.forEach(f => {
                if (f.defaultValue !== undefined) {
                  initialData[f.name] = f.defaultValue;
                }
              });
              setFormData(initialData);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            <Plus size={20} />
            Add {entityName}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${entityName.toLowerCase()}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                {displayFields.map(field => (
                  <th key={field} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {fields.find(f => f.name === field)?.label || field}
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={displayFields.length + 1} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-indigo-600 mb-2" size={32} />
                    <p className="text-slate-400 font-bold">Loading data...</p>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  {displayFields.map(field => (
                    <td key={field} className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">
                        {typeof item[field] === 'boolean' ? (item[field] ? 'Yes' : 'No') : 
                         fields.find(f => f.name === field)?.type === 'json' ? 
                         `${(item[field] || []).length} items` :
                         fields.find(f => f.name === field)?.type === 'html' ?
                         'HTML Content' :
                         String(item[field] || 'N/A')}
                      </span>
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingItem(item);
                          setFormData(item);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={displayFields.length + 1} className="px-6 py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-4">
                      <Database size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold">No records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black tracking-tighter text-slate-900">
                    {editingItem ? `Edit ${entityName}` : `Add ${entityName}`}
                  </h2>
                  <p className="text-slate-500 text-sm">Fill in the details for the {entityName.toLowerCase()} record.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 hover:bg-slate-200 rounded-2xl transition-colors"
                >
                  <MoreVertical size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fields.filter(f => !f.hidden).map(field => (
                    <div key={field.name} className={cn("space-y-2", field.type === 'textarea' && "md:col-span-2")}>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                      
                      {field.type === 'image' ? (
                        <div className="space-y-4">
                          {formData[field.name] && (
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-100">
                              <img src={formData[field.name]} alt={field.label} className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => setFormData({...formData, [field.name]: ''})}
                                className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg shadow-sm"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <label className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-center gap-2 px-5 py-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-100 transition-all">
                                <Upload size={18} />
                                <span className="text-sm font-bold">Upload</span>
                              </div>
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  
                                  try {
                                    const fileRef = ref(storage, `${collectionName}/${agencyId}/${Date.now()}_${file.name}`);
                                    const snapshot = await uploadBytes(fileRef, file);
                                    const url = await getDownloadURL(snapshot.ref);
                                    setFormData({...formData, [field.name]: url});
                                  } catch (err) {
                                    console.error("Upload error:", err);
                                  }
                                }}
                              />
                            </label>
                            <input 
                              type="url" 
                              placeholder="Or enter URL..."
                              value={formData[field.name] || ''}
                              onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                              className="flex-[2] px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                          </div>
                        </div>
                      ) : field.type === 'html' ? (
                        <div className="space-y-2 bg-white rounded-2xl overflow-hidden border border-slate-100">
                          <ReactQuill 
                            theme="snow"
                            value={formData[field.name] || ''}
                            onChange={(content) => setFormData({...formData, [field.name]: content})}
                            className="min-h-[200px]"
                          />
                        </div>
                      ) : field.type === 'textarea' ? (
                        <textarea 
                          required={field.required}
                          rows={3}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                        />
                      ) : field.type === 'json' ? (
                        <div className="space-y-2">
                          <textarea 
                            required={field.required}
                            rows={5}
                            value={typeof formData[field.name] === 'string' ? formData[field.name] : JSON.stringify(formData[field.name] || [], null, 2)}
                            onChange={(e) => {
                              try {
                                const val = JSON.parse(e.target.value);
                                setFormData({...formData, [field.name]: val});
                              } catch (err) {
                                setFormData({...formData, [field.name]: e.target.value});
                              }
                            }}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder='[{"label": "Home", "url": "/", "order": 1}]'
                          />
                          <p className="text-[10px] text-slate-400 italic">Enter valid JSON array of objects with label, url, and order.</p>
                        </div>
                      ) : field.type === 'select' ? (
                        <select 
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          <option value="">Select Option</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <div className="flex gap-4">
                          {[true, false].map((val) => (
                            <button
                              key={String(val)}
                              type="button"
                              onClick={() => setFormData({...formData, [field.name]: val})}
                              className={cn(
                                "flex-1 py-4 rounded-2xl font-bold text-sm transition-all border",
                                formData[field.name] === val 
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" 
                                  : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                              )}
                            >
                              {val ? 'Yes' : 'No'}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input 
                          required={field.required}
                          type={field.type} 
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex gap-4 sticky bottom-0 bg-white py-4 border-t border-slate-50">
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
                    {editingItem ? 'Update Record' : 'Create Record'}
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
