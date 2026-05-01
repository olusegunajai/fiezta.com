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
  Loader2
} from 'lucide-react';
import { SocialAccount, SocialPost, SocialPlatform, SocialMessage } from '../types';
import { cn } from '../lib/utils';
import { PostCreator } from './PostCreator';
import { SocialCalendar } from './SocialCalendar';
import { SocialInbox } from './SocialInbox';

interface SocialDashboardProps {
  agencyId: string;
}

export const SocialDashboard: React.FC<SocialDashboardProps> = ({ agencyId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calendar' | 'inbox' | 'accounts'>('overview');
  const [isPostCreatorOpen, setIsPostCreatorOpen] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/social/scheduled');
        const scheduledPosts = await response.json();

        const mockAccounts: SocialAccount[] = [
          {
            id: '1',
            agencyId,
            platform: 'facebook',
            accountName: 'Fiezta Luxury Travel',
            accountId: 'fb_123',
            accessToken: 'encrypted_token',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            agencyId,
            platform: 'instagram',
            accountName: '@fiezta_travel',
            accountId: 'ig_456',
            accessToken: 'encrypted_token',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            agencyId,
            platform: 'x',
            accountName: '@FieztaTravel',
            accountId: 'x_789',
            accessToken: 'encrypted_token',
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ];

        const mockPosts: SocialPost[] = [
          {
            id: 'p1',
            agencyId,
            accountId: '1',
            content: 'Discover the hidden gems of Santorini this summer! 🇬🇷 #Travel #Santorini #Luxury',
            platforms: ['facebook', 'instagram'],
            type: 'post',
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
            status: 'scheduled',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'p2',
            agencyId,
            accountId: '2',
            content: 'Our latest vlog from Bali is live! Check out the link in bio. 🌴',
            platforms: ['youtube', 'instagram'],
            type: 'reel',
            scheduledAt: new Date(Date.now() - 3600000).toISOString(),
            status: 'published',
            analytics: { likes: 1240, shares: 85, comments: 42, reach: 15000, impressions: 22000 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          ...scheduledPosts
        ];

        setAccounts(mockAccounts);
        setPosts(mockPosts);
      } catch (error) {
        console.error('Failed to fetch social data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [agencyId]);

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
        ].map((tab) => (
          <button
            key={tab.id}
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
                <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
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
                  <button className="text-sm font-bold text-indigo-600 hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {posts.map(post => (
                    <div key={post.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {post.platforms.map(p => (
                              <div key={p} className="w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-sm">
                                {p === 'facebook' && <Facebook size={14} className="text-blue-600" />}
                                {p === 'instagram' && <Instagram size={14} className="text-pink-600" />}
                                {p === 'x' && <Twitter size={14} className="text-slate-900" />}
                                {p === 'youtube' && <Youtube size={14} className="text-red-600" />}
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
                        <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><MoreVertical size={18} /></button>
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
            ].map((platform) => {
              const isConnected = accounts.some(a => a.platform === platform.id);
              return (
                <div key={platform.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center text-center">
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
    </div>
  );
};
