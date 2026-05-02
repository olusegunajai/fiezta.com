import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Linkedin, 
  Smartphone,
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
  Trash2,
  X
} from 'lucide-react';
import { SocialAccount, SocialPost, SocialPlatform, SocialMessage } from '../types';
import { cn } from '../lib/utils';
import { logActivity } from '../lib/security';
import { PostCreator } from './PostCreator';
import { SocialCalendar } from './SocialCalendar';
import { SocialInbox } from './SocialInbox';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  deleteDoc, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

interface SocialDashboardProps {
  agencyId: string;
  profile?: any;
}

export const SocialDashboard: React.FC<SocialDashboardProps> = ({ agencyId, profile }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'inbox' | 'accounts'>('overview');
  const [isPostCreatorOpen, setIsPostCreatorOpen] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [viewingPost, setViewingPost] = useState<SocialPost | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    // Fetch Accounts
    const accountsQuery = query(collection(db, 'social_accounts'), where('agencyId', '==', agencyId));
    const unsubscribeAccounts = onSnapshot(accountsQuery, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialAccount)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'social_accounts'));

    // Fetch Posts
    const postsQuery = query(collection(db, 'social_posts'), where('agencyId', '==', agencyId));
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialPost)));
      setIsLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'social_posts'));

    return () => {
      unsubscribeAccounts();
      unsubscribePosts();
    };
  }, [agencyId]);

  // Pagination Logic
  const totalPages = Math.ceil(posts.length / itemsPerPage);
  const paginatedPosts = posts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleConnectAccount = async (platform: SocialPlatform) => {
    try {
      const response = await fetch(`/api/auth/${platform}/url`);
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.platform === platform) {
          // In real app, refresh accounts from DB
          console.log(`Successfully connected ${platform}`);
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Failed to connect account:', error);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, 'social_posts', id));
        if (profile && agencyId) {
          await logActivity(agencyId, profile.uid, profile.displayName, 'DELETE', 'Social Post', id, `Deleted social post`);
        }
        setSelectedPostIds(prev => prev.filter(i => i !== id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `social_posts/${id}`);
      }
    }
  };

  const handleBulkDeletePosts = async () => {
    if (selectedPostIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedPostIds.length} posts?`)) {
      try {
        const batch = writeBatch(db);
        selectedPostIds.forEach(id => {
          batch.delete(doc(db, 'social_posts', id));
        });
        await batch.commit();

        if (profile && agencyId) {
          await logActivity(agencyId, profile.uid, profile.displayName, 'BULK_DELETE', 'Social Post', 'multiple', `Deleted ${selectedPostIds.length} social posts`);
        }
        setSelectedPostIds([]);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'social_posts');
      }
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedPostIds.length === 0) return;
    if (window.confirm(`Update status to "${newStatus}" for ${selectedPostIds.length} posts?`)) {
      try {
        const batch = writeBatch(db);
        selectedPostIds.forEach(id => {
          batch.update(doc(db, 'social_posts', id), { status: newStatus as any, updatedAt: new Date().toISOString() });
        });
        await batch.commit();

        if (profile && agencyId) {
          await logActivity(agencyId, profile.uid, profile.displayName, 'BULK_UPDATE', 'Social Post', 'multiple', `Updated status to ${newStatus} for ${selectedPostIds.length} posts`);
        }
        setSelectedPostIds([]);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'social_posts');
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Social Media Hub</h1>
          <p className="text-slate-500 text-sm">Schedule, automate, and analyze your social presence across all platforms.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveSubTab('accounts')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Settings size={18} />
            Accounts
          </button>
          <button 
            onClick={() => setIsPostCreatorOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            <Plus size={18} />
            Create Post
          </button>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full sm:w-fit overflow-x-auto custom-scrollbar shrink-0">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'inbox', label: 'Inbox', icon: MessageSquare },
          { id: 'accounts', label: 'Accounts', icon: Globe }
        ].map((tab, idx) => (
          <button
            key={`${tab.id}-${idx}`}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
              activeSubTab === tab.id 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon size={14} className="sm:w-4 sm:h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Reach', value: '124.5K', change: '+12%', icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Engagement', value: '8.2K', change: '+5.4%', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'Followers', value: '42.1K', change: '+2.1%', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Growth', value: '14.2%', change: '+0.8%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' }
              ].map((stat, i) => (
                <div key={`${stat.label}-${i}`} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                      <stat.icon size={24} />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{stat.change}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Posts */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">Recent Activity</h3>
                  <div className="flex items-center gap-3">
                    {selectedPostIds.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select 
                          onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                          className="text-[10px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none"
                        >
                          <option value="">Bulk Status</option>
                          <option value="draft">Draft</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="published">Published</option>
                        </select>
                        <button 
                          onClick={handleBulkDeletePosts}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 shadow-lg shadow-rose-100 transition-all font-mono"
                        >
                          <Trash2 size={16} />
                          DELETE ({selectedPostIds.length})
                        </button>
                      </div>
                    )}
                    <button className="text-sm font-bold text-indigo-600 hover:underline">View All</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {paginatedPosts.map(post => (
                    <div 
                      key={post.id} 
                      className={cn(
                        "bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative",
                        selectedPostIds.includes(post.id) && "ring-2 ring-indigo-500 bg-indigo-50/50"
                      )}
                      onClick={() => {
                        if (selectedPostIds.includes(post.id)) {
                          setSelectedPostIds(prev => prev.filter(id => id !== post.id));
                        } else {
                          setSelectedPostIds(prev => [...prev, post.id]);
                        }
                      }}
                    >
                      {selectedPostIds.includes(post.id) && (
                        <div className="absolute top-4 left-4 bg-indigo-600 text-white p-1 rounded-full shadow-lg z-10">
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {post.platforms.map((p, platIdx) => (
                              <div key={`${p}-${platIdx}`} className="w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-sm">
                                {p === 'facebook' && <Facebook size={14} className="text-blue-600" />}
                                {p === 'instagram' && <Instagram size={14} className="text-pink-600" />}
                                {p === 'x' && <Twitter size={14} className="text-slate-900" />}
                                {p === 'youtube' && <Youtube size={14} className="text-red-600" />}
                                {p === 'tiktok' && <Smartphone size={14} className="text-slate-900" />}
                              </div>
                            ))}
                          </div>
                          <div>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                              post.status === 'published' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {post.status}
                            </span>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {post.status === 'published' ? 'Published' : 'Scheduled for'} {new Date(post.scheduledAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingPost(post);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-700 mb-6 line-clamp-2">{post.content}</p>
                      {post.analytics && (
                        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            <Heart size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">{post.analytics.likes}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">{post.analytics.comments}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Share2 size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">{post.analytics.shares}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">{post.analytics.reach}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white px-8 py-4 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="text-sm font-bold text-slate-500">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <MoreVertical size={18} className="rotate-90" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <MoreVertical size={18} className="-rotate-90" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar: Connected Accounts & AI Suggestions */}
              <div className="space-y-8">
                <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl">
                  <h3 className="text-xl font-black mb-6">Connected Accounts</h3>
                  <div className="space-y-4">
                    {accounts.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            {acc.platform === 'facebook' && <Facebook size={20} />}
                            {acc.platform === 'instagram' && <Instagram size={20} />}
                            {acc.platform === 'x' && <Twitter size={20} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{acc.accountName}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{acc.platform}</p>
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setActiveSubTab('accounts')}
                      className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Add Account
                    </button>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-[32px] p-8 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-indigo-600" size={24} />
                    <h3 className="font-bold text-indigo-900">AI Content Assistant</h3>
                  </div>
                  <p className="text-indigo-600 text-sm mb-6">Trending: "Eco-friendly travel in 2026". Suggesting a post about sustainable resorts in Costa Rica.</p>
                  <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
                    Generate Post
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'calendar' && <SocialCalendar posts={posts} />}
        {activeSubTab === 'inbox' && <SocialInbox agencyId={agencyId} />}
        {activeSubTab === 'accounts' && (
          <motion.div
            key="accounts"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
              { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
              { id: 'tiktok', name: 'TikTok', icon: Smartphone, color: 'text-slate-900', bg: 'bg-slate-100' },
              { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
              { id: 'x', name: 'X (Twitter)', icon: Twitter, color: 'text-slate-900', bg: 'bg-slate-100' },
              { id: 'threads', name: 'Threads', icon: MessageSquare, color: 'text-slate-900', bg: 'bg-slate-100' }
            ].map((platform, platIdx) => {
              const isConnected = accounts.some(a => a.platform === platform.id);
              return (
                <div key={`${platform.id}-${platIdx}`} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", platform.bg, platform.color)}>
                    <platform.icon size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{platform.name}</h3>
                  <p className="text-slate-500 text-sm mb-8">Connect your {platform.name} account to schedule posts and track analytics.</p>
                  {isConnected ? (
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <CheckCircle2 size={18} />
                      Connected
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleConnectAccount(platform.id as SocialPlatform)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all"
                    >
                      Connect Account
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Creator Modal */}
      {isPostCreatorOpen && (
        <PostCreator 
          agencyId={agencyId} 
          accounts={accounts}
          onClose={() => setIsPostCreatorOpen(false)} 
          onSuccess={() => {
            setIsPostCreatorOpen(false);
            // Refresh posts
          }}
        />
      )}

      {/* View Post Modal */}
      <AnimatePresence>
        {viewingPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Post Details</h3>
                <button onClick={() => setViewingPost(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {viewingPost.platforms.map((p, pIdx) => (
                      <div key={`${p}-${pIdx}`} className="w-10 h-10 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-md">
                        {p === 'facebook' && <Facebook size={18} className="text-blue-600" />}
                        {p === 'instagram' && <Instagram size={18} className="text-pink-600" />}
                        {p === 'x' && <Twitter size={18} className="text-slate-900" />}
                        {p === 'youtube' && <Youtube size={18} className="text-red-600" />}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Scheduled for</h4>
                    <p className="text-sm text-slate-500">{new Date(viewingPost.scheduledAt).toLocaleString()}</p>
                  </div>
                  <span className={cn(
                    "ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                    viewingPost.status === 'published' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {viewingPost.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl">
                  <p className="text-slate-700 whitespace-pre-wrap">{viewingPost.content}</p>
                </div>

                {viewingPost.analytics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Likes', value: viewingPost.analytics.likes, icon: Heart, color: 'text-rose-500' },
                      { label: 'Comments', value: viewingPost.analytics.comments, icon: MessageSquare, color: 'text-indigo-500' },
                      { label: 'Shares', value: viewingPost.analytics.shares, icon: Share2, color: 'text-sky-500' },
                      { label: 'Reach', value: viewingPost.analytics.reach, icon: Eye, color: 'text-emerald-500' }
                    ].map((stat, i) => (
                      <div key={`${stat.label}-${i}`} className="p-4 bg-white border border-slate-100 rounded-2xl text-center">
                        <stat.icon size={20} className={cn("mx-auto mb-2", stat.color)} />
                        <p className="text-lg font-black text-slate-900">{stat.value.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setViewingPost(null)}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
                <button 
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Edit Post
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
