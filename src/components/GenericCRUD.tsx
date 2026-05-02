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
  Zap,
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
import { logActivity } from '../lib/security';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { PageBuilder } from './PageBuilder';

interface GenericCRUDProps {
  entityName: string;
  collectionName: string;
  agencyId: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'url' | 'hidden' | 'json' | 'image' | 'html' | 'page-builder';
    options?: string[];
    required?: boolean;
    hidden?: boolean;
    defaultValue?: any;
  }[];
  displayFields: string[];
  fixedFilters?: Record<string, any>;
  allowFiltering?: boolean;
  allowSorting?: boolean;
  profile?: any;
}

export const GenericCRUD: React.FC<GenericCRUDProps> = ({ 
  entityName, 
  collectionName, 
  agencyId, 
  fields,
  displayFields,
  fixedFilters,
  allowFiltering = false,
  allowSorting = false,
  profile
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState<any>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

    if (activeFilter) {
      Object.entries(activeFilter).forEach(([field, value]) => {
        if (value) {
          q = query(q, where(field, '==', value));
        }
      });
    }

    q = query(q, orderBy(sortBy, sortOrder));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, collectionName));
    
    return () => unsubscribe();
  }, [collectionName, agencyId]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected records?`)) {
      try {
        const ids = Array.from(selectedIds);
        const deletePromises = ids.map(id => deleteDoc(doc(db, collectionName, id)));
        await Promise.all(deletePromises);
        
        if (profile && agencyId) {
          await logActivity(agencyId, profile.uid, profile.displayName, 'BULK_DELETE', entityName, 'multiple', `Deleted ${ids.length} items from ${collectionName}`);
        }
        
        setSelectedIds(new Set());
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, collectionName);
      }
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm(`Scan ${data.length} records for duplicates? This will identify entries with identical content and keep only the oldest one.`)) return;
    
    setLoading(true);
    try {
      const uniqueItems = new Map();
      const duplicatesToDelete: string[] = [];

      // Sort by creation date to keep the oldest
      const sortedData = [...data].sort((a, b) => 
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );

      sortedData.forEach(item => {
        // Create a unique key based on important content fields
        const { id, createdAt, updatedAt, agencyId, ...content } = item;
        
        // Sort keys to ensure consistent hashing regardless of property order
        const sortedKeys = Object.keys(content).sort();
        const normalizedContent = sortedKeys.reduce((acc: any, key) => {
          // Normalize values (trim strings, ensure consistent types)
          const val = content[key];
          acc[key] = typeof val === 'string' ? val.trim() : val;
          return acc;
        }, {});
        
        const hash = JSON.stringify(normalizedContent);
        
        if (uniqueItems.has(hash)) {
          duplicatesToDelete.push(item.id);
        } else {
          uniqueItems.set(hash, item.id);
        }
      });

      if (duplicatesToDelete.length === 0) {
        alert("Success: No duplicate records found in this collection.");
      } else {
        if (window.confirm(`Found ${duplicatesToDelete.length} potential duplicates. Proceed with removing them?`)) {
          const deletePromises = duplicatesToDelete.map(id => deleteDoc(doc(db, collectionName, id)));
          await Promise.all(deletePromises);
          
          if (profile && agencyId) {
            await logActivity(agencyId, profile.uid, profile.displayName, 'CLEANUP', entityName, 'multiple', `Removed ${duplicatesToDelete.length} duplicate items from ${collectionName}`);
          }
          alert(`Successfully cleaned up ${duplicatesToDelete.length} duplicate records.`);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collectionName);
    } finally {
      setLoading(false);
    }
  };

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
      handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, collectionName);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${entityName}?`)) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        if (profile && agencyId) {
          await logActivity(agencyId, profile.uid, profile.displayName, 'DELETE', entityName, id, `Deleted ${entityName}`);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, collectionName);
      }
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900">{entityName}</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Manage all your {entityName.toLowerCase()} records.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {selectedIds.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-50 border border-indigo-100 rounded-2xl"
            >
              <span className="text-xs sm:text-sm font-bold text-indigo-600">{selectedIds.size} selected</span>
              
              {fields.some(f => f.name === 'status') && (
                <select 
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    if (!newStatus) return;
                    if (window.confirm(`Update status to "${newStatus}" for ${selectedIds.size} records?`)) {
                      try {
                        const updatePromises = Array.from(selectedIds).map(id => 
                          updateDoc(doc(db, collectionName, id), { status: newStatus, updatedAt: new Date().toISOString() })
                        );
                        await Promise.all(updatePromises);
                        setSelectedIds(new Set());
                      } catch (err) {
                        console.error("Bulk status update error:", err);
                      }
                    }
                  }}
                  className="text-[10px] sm:text-xs font-bold bg-white border border-indigo-200 rounded-lg px-2 py-1 text-indigo-600 focus:outline-none"
                >
                  <option value="">Bulk Status</option>
                  {fields.find(f => f.name === 'status')?.options?.map((opt, idx) => (
                    <option key={`${opt}-${idx}`} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              <button 
                onClick={handleBulkDelete}
                className="p-1 sm:p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                title="Bulk Delete"
              >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </motion.div>
          )}
          <button 
            onClick={handleCleanup}
            className="flex-1 sm:flex-none flex items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl text-amber-600 hover:bg-amber-50 transition-all shadow-sm"
            title="Clean Repeated Data"
          >
            <Zap size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} className="sm:w-5 sm:h-5" />
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all text-sm sm:text-base"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Add</span> {entityName}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-80 lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 sm:w-[18px] sm:h-[18px]" size={16} />
            <input 
              type="text" 
              placeholder={`Search ${entityName.toLowerCase()}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            {allowFiltering && fields.some(f => f.name === 'status') && (
              <select 
                onChange={(e) => setActiveFilter({ ...activeFilter, status: e.target.value })}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-600 focus:outline-none"
              >
                <option value="">All Status</option>
                {fields.find(f => f.name === 'status')?.options?.map((opt, optIdx) => (
                  <option key={`${opt}-${optIdx}`} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {allowSorting && (
              <select 
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-600 focus:outline-none"
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="updatedAt:desc">Recently Updated</option>
              </select>
            )}
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter size={14} className="sm:w-4 sm:h-4" />
              More Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                {displayFields.map((field, idx) => (
                  <th key={`${field}-${idx}`} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {fields.find(f => f.name === field)?.label || field}
                  </th>
                ))}
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={displayFields.length + 2} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-indigo-600 mb-2" size={32} />
                    <p className="text-slate-400 font-bold">Loading data...</p>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? paginatedData.map((item) => (
                <tr key={item.id} className={cn(
                  "hover:bg-slate-50/50 transition-colors group",
                  selectedIds.has(item.id) && "bg-indigo-50/30"
                )}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  {displayFields.map((field, idx) => (
                    <td key={`${field}-${idx}`} className="px-6 py-4">
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
                          setViewingItem(item);
                          setIsViewModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="View"
                      >
                        <Search size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingItem(item);
                          setFormData(item);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
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
                  <td colSpan={displayFields.length + 2} className="px-6 py-20 text-center">
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

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex items-center gap-4">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Showing <span className="text-slate-900 font-bold">{Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredData.length, currentPage * itemsPerPage)}</span> of <span className="text-slate-900 font-bold">{filteredData.length}</span>
              </span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
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
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-bold transition-all",
                        currentPage === pageNum 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                          : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
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
        {isViewModalOpen && viewingItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white sm:rounded-[40px] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30 shrink-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900">
                    View {entityName}
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm">Detailed information for this record.</p>
                </div>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 sm:p-3 hover:bg-slate-200 rounded-xl sm:rounded-2xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {fields.map((field, fIdx) => (
                    <div key={`${field.name}-${fIdx}`} className={cn("space-y-1.5", (field.type === 'textarea' || field.type === 'json' || field.type === 'page-builder' || field.type === 'html') && "md:col-span-2")}>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{field.label}</span>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        {field.type === 'image' ? (
                          viewingItem[field.name] ? (
                            <img src={viewingItem[field.name]} alt={field.label} className="w-full max-h-64 object-contain rounded-xl" />
                          ) : (
                            <span className="text-sm text-slate-400 italic">No image</span>
                          )
                        ) : field.type === 'html' ? (
                          <div className="prose prose-sm max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: viewingItem[field.name] || '' }} />
                        ) : field.type === 'json' ? (
                          <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap">{JSON.stringify(viewingItem[field.name], null, 2)}</pre>
                        ) : field.type === 'boolean' ? (
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold",
                            viewingItem[field.name] ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {viewingItem[field.name] ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-700 block break-words">
                            {String(viewingItem[field.name] || 'N/A')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Created At</span>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-sm font-medium text-slate-600 italic">
                        {viewingItem.createdAt ? new Date(viewingItem.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Updated</span>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-sm font-medium text-slate-600 italic">
                        {viewingItem.updatedAt ? new Date(viewingItem.updatedAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
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
                    setEditingItem(viewingItem);
                    setFormData(viewingItem);
                    setIsViewModalOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                >
                  Edit Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white sm:rounded-[40px] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900">
                    {editingItem ? `Edit ${entityName}` : `Add ${entityName}`}
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm">Fill in the details for the {entityName.toLowerCase()} record.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 sm:p-3 hover:bg-slate-200 rounded-xl sm:rounded-2xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 p-6 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar">
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
                      ) : field.type === 'page-builder' ? (
                        <div className="md:col-span-2">
                          <PageBuilder 
                            value={formData[field.name] || []} 
                            onChange={(val) => setFormData({...formData, [field.name]: val})} 
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
                          {field.options?.map((opt, optIdx) => (
                            <option key={`${opt}-${optIdx}`} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <div className="flex gap-4">
                          {[true, false].map((val, vIdx) => (
                            <button
                              key={`${String(val)}-${vIdx}`}
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
