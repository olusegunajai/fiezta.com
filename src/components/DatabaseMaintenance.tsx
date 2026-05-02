import React, { useState } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Zap, ShieldAlert, Loader2, Database, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logActivity } from '../lib/security';

interface DatabaseMaintenanceProps {
  agencyId: string;
  profile: any;
}

const COLLECTIONS_TO_CLEAN = [
  { id: 'packages', name: 'Travel Packages' },
  { id: 'bookings', name: 'Bookings' },
  { id: 'accommodations', name: 'Accommodations' },
  { id: 'transport', name: 'Transport' },
  { id: 'invoices', name: 'Invoices' },
  { id: 'tasks', name: 'Tasks' },
  { id: 'subscribers', name: 'Newsletter Subscribers' },
  { id: 'wp_posts', name: 'WP Blog Posts' },
  { id: 'menus', name: 'Menus' },
  { id: 'services', name: 'Services' },
  { id: 'reviews', name: 'Customer Reviews' },
  { id: 'faqs', name: 'FAQs' },
  { id: 'pages', name: 'CMS Pages' },
  { id: 'inventions', name: 'Inventions' },
  { id: 'custom_forms', name: 'Custom Forms' },
  { id: 'popup_campaigns', name: 'Popup Campaigns' },
  { id: 'coupons', name: 'Coupons' }
];

export const DatabaseMaintenance: React.FC<DatabaseMaintenanceProps> = ({ agencyId, profile }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string, scanned: number, deleted: number }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentCollection, setCurrentCollection] = useState('');

  const runGlobalCleanup = async () => {
    if (!window.confirm("CRITICAL: You are about to scan ALL database collections for duplicate records. Only the oldest unique version of each record will be kept. Proceed?")) return;

    setIsProcessing(true);
    setResults([]);
    setShowResults(false);

    try {
      const maintenanceResults = [];

      for (const entity of COLLECTIONS_TO_CLEAN) {
        setCurrentCollection(entity.name);
        
        const q = query(
          collection(db, entity.id),
          where('agencyId', '==', agencyId)
        );
        
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const uniqueItems = new Map();
        const duplicatesToDelete: string[] = [];

        // Sort by creation date to keep the oldest
        const sortedDocs = [...docs].sort((a: any, b: any) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );

        sortedDocs.forEach((item: any) => {
          const { id, createdAt, updatedAt, agencyId: itemAgencyId, ...content } = item;
          
          // Sort keys for consistent comparison
          const sortedKeys = Object.keys(content).sort();
          const normalizedContent = sortedKeys.reduce((acc: any, key) => {
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

        if (duplicatesToDelete.length > 0) {
          const deletePromises = duplicatesToDelete.map(id => deleteDoc(doc(db, entity.id, id)));
          await Promise.all(deletePromises);
          
          await logActivity(
            agencyId, 
            profile.uid, 
            profile.displayName, 
            'CLEANUP_GLOBAL', 
            entity.name, 
            'batch', 
            `Global cleanup removed ${duplicatesToDelete.length} duplicates from ${entity.id}`
          );
        }

        maintenanceResults.push({
          name: entity.name,
          scanned: docs.length,
          deleted: duplicatesToDelete.length
        });
      }

      setResults(maintenanceResults);
      setShowResults(true);
    } catch (error) {
      console.error("Global cleanup failed:", error);
      alert("Error during global cleanup. Check console for details.");
    } finally {
      setIsProcessing(false);
      setCurrentCollection('');
    }
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 sm:p-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 text-amber-600 mb-6 font-black uppercase tracking-widest text-xs">
            <ShieldAlert size={20} />
            Advanced System Utility
          </div>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-6 leading-none uppercase">Database <span className="text-amber-600">Maintenance</span></h1>
          <p className="text-xl text-slate-500 leading-relaxed italic">
            "Your database is the heart of your travel empire. Keep it pristine, efficient, and free of redundancy."
          </p>
        </div>
        
        <button
          onClick={runGlobalCleanup}
          disabled={isProcessing}
          className="px-10 py-5 bg-amber-600 text-white rounded-[32px] font-black uppercase tracking-widest text-lg hover:bg-amber-700 shadow-2xl shadow-amber-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <Zap size={24} className="group-hover:scale-110 transition-transform" />
          )}
          {isProcessing ? 'Processing...' : 'Run All-In-One Clean'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
         <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
             <Database size={24} className="text-slate-400" />
           </div>
           <h3 className="text-xl font-black text-slate-900 mb-2">Deduplication</h3>
           <p className="text-sm text-slate-500">Scans all 17 core collections for identical records and removes leftovers.</p>
         </div>
         <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
             <CheckCircle2 size={24} className="text-emerald-500" />
           </div>
           <h3 className="text-xl font-black text-slate-900 mb-2">Integrity Check</h3>
           <p className="text-sm text-slate-500">Ensures metadata is standardized across your agency's data points.</p>
         </div>
         <div className="p-8 bg-slate-100/50 rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <AlertTriangle size={32} className="text-slate-300 mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">More Tools Coming Soon</p>
         </div>
      </div>

      {isProcessing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-10 bg-amber-50 rounded-[40px] border border-amber-100 text-center"
        >
          <Loader2 className="animate-spin text-amber-600 mx-auto mb-6" size={48} />
          <h3 className="text-2xl font-black text-slate-900 mb-2">Sanitizing {currentCollection}...</h3>
          <p className="text-slate-500 font-medium tracking-tight">Comparing records across the cloud. Please stay on this page.</p>
        </motion.div>
      )}

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Cleanup Summary</h2>
              <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest">Operation Complete</span>
            </div>
            
            <div className="overflow-hidden bg-white border border-slate-100 rounded-[32px] shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Collection</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Records Scanned</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Duplicates Removed</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {results.map((res) => (
                    <tr key={res.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-sm font-black text-slate-900">{res.name}</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-600">{res.scanned}</td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-xs font-black",
                          res.deleted > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
                        )}>
                          {res.deleted} REMOVED
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle2 size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Pristine</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end p-4">
               <button 
                onClick={() => setShowResults(false)}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
               >
                 Dismiss Report
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple cn utility for standalone component
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
