import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  type User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  UserProfile, 
  UserRole, 
  TravelPackage, 
  Booking, 
  BookingStatus, 
  Destination, 
  Invoice, 
  Payment, 
  Document as TravelDocument,
  InternalMessage,
  Accommodation,
  Transport,
  ActivityLog,
  NewsletterSubscriber,
  WPPost,
  WPConfig,
  CustomForm,
  PopupCampaign,
  CalendarEvent,
  SocialPost,
  AuditLog,
  Coupon
} from './types';
import { cn, formatCurrency } from './lib/utils';
import { handleFirestoreError, OperationType } from './lib/error-handler';
import { encryptData, decryptData, logActivity } from './lib/security';
import { exportToCSV, exportToPDF } from './lib/export';
import { SocialDashboard } from './components/SocialDashboard';
import { 
  LayoutDashboard, 
  Globe, 
  Briefcase, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Plus, 
  PlusCircle,
  Search, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Clock4,
  AlertCircle,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  Edit2,
  Copy,
  Eye,
  FileText,
  Hotel,
  Car,
  FileCheck,
  CheckSquare,
  ShieldCheck,
  PieChart,
  Home,
  MapPin,
  Clock3,
  DollarSign,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Activity,
  Mail,
  Smartphone,
  MessageCircle,
  Download,
  Filter,
  MoreVertical,
  UserPlus,
  Target,
  Award,
  Zap,
  CheckCircle2,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  Plane,
  Heart,
  User as UserIcon,
  Map as MapIcon,
  Layout,
  MousePointer2,
  CalendarDays,
  ExternalLink,
  RefreshCw,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { generateItinerary, getTravelAdvice, generateText } from './services/geminiService';
import { BookingWizard } from './components/BookingWizard';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatusBadge = ({ status, type = 'booking' }: { status: string, type?: 'booking' | 'invoice' | 'task' }) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-indigo-100 text-indigo-700 border-indigo-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    unpaid: "bg-rose-100 text-rose-700 border-rose-200",
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    overdue: "bg-rose-500 text-white border-rose-600",
    todo: "bg-slate-100 text-slate-700 border-slate-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    done: "bg-emerald-100 text-emerald-700 border-emerald-200"
  };
  
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider", styles[status] || "bg-slate-100 text-slate-700 border-slate-200")}>
      {status.replace('_', ' ')}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [transport, setTransport] = useState<Transport[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  
  // WordPress & Marketing State
  const [wpPosts, setWpPosts] = useState<WPPost[]>([]);
  const [wpConfig, setWpConfig] = useState<WPConfig>({ agencyId: '', url: 'https://blog.fiezta.com', apiKey: '********', status: 'connected' });
  const [customForms, setCustomForms] = useState<CustomForm[]>([]);
  const [popupCampaigns, setPopupCampaigns] = useState<PopupCampaign[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  // AI Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Booking Modal State
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Booking Detail Modal State
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<any | null>(null);
  const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] = useState(false);
  const [bookingItinerary, setBookingItinerary] = useState<any | null>(null);
  const [bookingInvoices, setBookingInvoices] = useState<any[]>([]);
  const [bookingDocuments, setBookingDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedBookingDetail) return;

    // Filter related items from existing state
    setBookingInvoices(invoices.filter(inv => inv.bookingId === selectedBookingDetail.id));
    setBookingDocuments(documents.filter(doc => doc.bookingId === selectedBookingDetail.id));
    
    // Fetch itinerary for this booking
    const fetchItinerary = async () => {
      const q = query(collection(db, 'itineraries'), where('bookingId', '==', selectedBookingDetail.id));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setBookingItinerary({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setBookingItinerary(null);
      }
    };
    fetchItinerary();
  }, [selectedBookingDetail, invoices, documents]);

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
      if (selectedBookingDetail && selectedBookingDetail.id === bookingId) {
        setSelectedBookingDetail({ ...selectedBookingDetail, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const BookingDetailModal = () => {
    if (!isBookingDetailModalOpen || !selectedBookingDetail) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden my-8"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black tracking-tighter text-slate-900">Booking Details</h2>
                <span className="text-sm font-mono text-slate-400">#{selectedBookingDetail.id.slice(0, 8)}</span>
              </div>
              <p className="text-slate-500 text-sm">Manage and view all information related to this booking.</p>
            </div>
            <button 
              onClick={() => setIsBookingDetailModalOpen(false)}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: General Info */}
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-[#D4AF37]" />
                    Package Information
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">{selectedBookingDetail.packageName}</h4>
                        <p className="text-slate-500 flex items-center gap-1 mt-1">
                          <Calendar size={14} />
                          Travel Date: {new Date(selectedBookingDetail.travelDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-[#D4AF37]">{formatCurrency(selectedBookingDetail.totalAmount)}</p>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Total Amount</p>
                      </div>
                    </div>
                    {selectedBookingDetail.notes && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Notes</p>
                        <p className="text-sm text-slate-600 italic">"{selectedBookingDetail.notes}"</p>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Sparkles size={20} className="text-[#D4AF37]" />
                    Itinerary
                  </h3>
                  {bookingItinerary ? (
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-[#D4AF37]">Personalized Travel Plan</span>
                        <span className="text-[10px] bg-[#D4AF37] text-white px-2 py-0.5 rounded-full uppercase font-bold">AI Generated</span>
                      </div>
                      <div className="p-6 prose prose-slate prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-slate-600 leading-relaxed">
                          {bookingItinerary.content}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-400 text-sm">No itinerary has been generated for this booking yet.</p>
                      {profile?.role === 'admin' && (
                        <button className="mt-4 px-4 py-2 bg-[#D4AF37] text-white rounded-xl font-bold text-sm hover:bg-[#B8962E] transition-all">
                          Generate Itinerary
                        </button>
                      )}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: Status & Related Items */}
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Status Management</h3>
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <div className="mb-4">
                      <StatusBadge status={selectedBookingDetail.status} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Update Status</p>
                      {(['pending', 'confirmed', 'completed', 'cancelled'] as BookingStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateBookingStatus(selectedBookingDetail.id, status)}
                          className={cn(
                            "w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize",
                            selectedBookingDetail.status === status 
                              ? "bg-[#D4AF37] text-white" 
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Invoices</h3>
                  <div className="space-y-3">
                    {bookingInvoices.length > 0 ? bookingInvoices.map((inv) => (
                      <div key={inv.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(inv.amount)}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          inv.status === 'paid' ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                        )}>
                          {inv.status}
                        </span>
                      </div>
                    )) : (
                      <p className="text-slate-400 text-xs text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No invoices found.</p>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Documents</h3>
                  <div className="space-y-3">
                    {bookingDocuments.length > 0 ? bookingDocuments.map((doc) => (
                      <div key={doc.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{doc.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{doc.type}</p>
                          </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-[#D4AF37] transition-colors">
                          <FileText size={16} />
                        </button>
                      </div>
                    )) : (
                      <p className="text-slate-400 text-xs text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No documents found.</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
            <button 
              onClick={() => setIsBookingDetailModalOpen(false)}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              Close
            </button>
            {profile?.role === 'admin' && (
              <button className="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-bold hover:bg-rose-100 transition-all flex items-center gap-2">
                <Trash2 size={18} />
                Delete Booking
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            setProfile(userData);
            setAgencyId(userData.agencyId);
          } else {
            const defaultAgencyId = 'agency_001'; // Default for new users in this demo
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              agencyId: defaultAgencyId,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'client',
              photoURL: firebaseUser.photoURL || undefined,
              loyaltyPoints: 0,
              referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
              preferences: {
                destinations: [],
                budget: 'mid-range',
                travelType: 'solo',
                dietary: []
              },
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
            setAgencyId(defaultAgencyId);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!profile || !agencyId) return;

    // Fetch Packages
    const packagesUnsub = onSnapshot(query(collection(db, 'packages'), where('agencyId', '==', agencyId)), (snapshot) => {
      setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TravelPackage)));
    });

    // Fetch Bookings
    let bookingsQuery;
    if (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'agent') {
      bookingsQuery = query(collection(db, 'bookings'), where('agencyId', '==', agencyId), orderBy('createdAt', 'desc'));
    } else {
      bookingsQuery = query(collection(db, 'bookings'), where('agencyId', '==', agencyId), where('clientId', '==', profile.uid), orderBy('createdAt', 'desc'));
    }
    
    const bookingsUnsub = onSnapshot(bookingsQuery, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    });

    // Fetch Accommodations
    const accUnsub = onSnapshot(query(collection(db, 'accommodations'), where('agencyId', '==', agencyId)), (snapshot) => {
      setAccommodations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Accommodation)));
    });

    // Fetch Transports
    const transUnsub = onSnapshot(query(collection(db, 'transport'), where('agencyId', '==', agencyId)), (snapshot) => {
      setTransport(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transport)));
    });

    // Fetch Invoices
    const invQuery = (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'accountant') 
      ? query(collection(db, 'invoices'), where('agencyId', '==', agencyId)) 
      : query(collection(db, 'invoices'), where('agencyId', '==', agencyId), where('clientId', '==', profile.uid));
    const invUnsub = onSnapshot(invQuery, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
    });

    // Fetch Documents
    const docQuery = (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'agent') 
      ? query(collection(db, 'documents'), where('agencyId', '==', agencyId)) 
      : query(collection(db, 'documents'), where('agencyId', '==', agencyId), where('clientId', '==', profile.uid));
    const docUnsub = onSnapshot(docQuery, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TravelDocument)));
    });

    // Fetch Tasks
    const taskUnsub = onSnapshot(query(collection(db, 'tasks'), where('agencyId', '==', agencyId)), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Staff
    let staffUnsub = () => {};
    if (profile.role === 'super_admin' || profile.role === 'admin') {
      staffUnsub = onSnapshot(query(collection(db, 'users'), where('agencyId', '==', agencyId), where('role', '!=', 'client')), (snapshot) => {
        setStaff(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      });
    }

    // Fetch Messages
    const msgQuery = query(
      collection(db, 'messages'), 
      where('agencyId', '==', agencyId),
      where('receiverId', 'in', [profile.uid, 'all']),
      orderBy('timestamp', 'desc')
    );
    const msgUnsub = onSnapshot(msgQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InternalMessage)));
    });

    // Fetch Audit Logs
    let logsUnsub = () => {};
    if (profile.role === 'super_admin' || profile.role === 'admin') {
      logsUnsub = onSnapshot(query(collection(db, 'audit_logs'), where('agencyId', '==', agencyId), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
        setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
      });
    }

    // Fetch Subscribers
    let subUnsub = () => {};
    if (profile.role === 'super_admin' || profile.role === 'admin') {
      subUnsub = onSnapshot(query(collection(db, 'subscribers'), where('agencyId', '==', agencyId)), (snapshot) => {
        setSubscribers(snapshot.docs.map(doc => ({ email: doc.id, ...doc.data() } as NewsletterSubscriber)));
      });
    }

    // Fetch Clients
    let clientsUnsub = () => {};
    if (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'agent') {
      clientsUnsub = onSnapshot(query(collection(db, 'users'), where('agencyId', '==', agencyId), where('role', '==', 'client')), (snapshot) => {
        setClients(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      });
    }

    // Fetch WP Posts
    const wpPostsUnsub = onSnapshot(query(collection(db, 'wp_posts'), where('agencyId', '==', agencyId)), (snapshot) => {
      setWpPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    // Fetch Custom Forms
    const formsUnsub = onSnapshot(query(collection(db, 'custom_forms'), where('agencyId', '==', agencyId)), (snapshot) => {
      setCustomForms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomForm)));
    });

    // Fetch Popup Campaigns
    const popupsUnsub = onSnapshot(query(collection(db, 'popup_campaigns'), where('agencyId', '==', agencyId)), (snapshot) => {
      setPopupCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PopupCampaign)));
    });

    // Fetch Calendar Events
    const calendarUnsub = onSnapshot(query(collection(db, 'calendar_events'), where('agencyId', '==', agencyId)), (snapshot) => {
      setCalendarEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent)));
    });

    // Fetch Social Posts
    const socialUnsub = onSnapshot(query(collection(db, 'social_posts'), where('agencyId', '==', agencyId), orderBy('scheduledAt', 'desc')), (snapshot) => {
      setSocialPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialPost)));
    });

    // Fetch Coupons
    const couponsUnsub = onSnapshot(query(collection(db, 'coupons'), where('agencyId', '==', agencyId)), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
    });

    return () => {
      packagesUnsub();
      bookingsUnsub();
      accUnsub();
      transUnsub();
      invUnsub();
      docUnsub();
      taskUnsub();
      staffUnsub();
      msgUnsub();
      logsUnsub();
      subUnsub();
      clientsUnsub();
      wpPostsUnsub();
      formsUnsub();
      popupsUnsub();
      calendarUnsub();
      socialUnsub();
      couponsUnsub();
    };
  }, [profile, agencyId]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const generateAIInsights = async (client: UserProfile) => {
    if (!profile || profile.role !== 'admin') return;
    try {
      const prompt = `Based on this travel client profile, generate a short, professional 2-sentence insight for a travel agent.
      Name: ${client.displayName}
      Preferences: ${JSON.stringify(client.preferences)}
      Travel History: ${bookings.filter(b => b.clientId === client.uid).map(b => b.packageName).join(', ')}
      Focus on their budget, preferred destinations, and travel style.`;
      
      const response = await generateText(prompt);
      await updateDoc(doc(db, 'users', client.uid), {
        aiInsights: response,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("AI Insight generation failed:", error);
    }
  };

  const handleAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const aiResponse = await getTravelAdvice(userMsg);
      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse || 'Sorry, I couldn\'t help with that.' }]);
    } catch (error) {
      console.error("AI Chat failed", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBookPackage = (pkg: TravelPackage) => {
    setSelectedPackage(pkg);
    setIsBookingModalOpen(true);
  };

  // Seed data for new modules if empty
  useEffect(() => {
    if (profile?.role === 'admin') {
      const seedData = async () => {
        // Seed WP Posts
        if (wpPosts.length === 0) {
          const posts = [
            { title: 'Top 10 Destinations for 2026', excerpt: 'Discover the most breathtaking places to visit this year...', date: new Date().toISOString(), status: 'publish', link: '#' },
            { title: 'How to Plan Your Dream Wedding Abroad', excerpt: 'Everything you need to know about destination weddings...', date: new Date().toISOString(), status: 'publish', link: '#' }
          ];
          for (const post of posts) {
            await addDoc(collection(db, 'wp_posts'), post);
          }
        }

        // Seed Custom Forms
        if (customForms.length === 0) {
          await addDoc(collection(db, 'custom_forms'), {
            title: 'Lead Capture - Summer 2026',
            fields: [
              { label: 'Full Name', type: 'text', required: true },
              { label: 'Email Address', type: 'email', required: true },
              { label: 'Preferred Destination', type: 'select', options: ['Dubai', 'Maldives', 'USA'], required: false }
            ],
            createdAt: new Date().toISOString()
          });
        }

        // Seed Popup Campaigns
        if (popupCampaigns.length === 0) {
          await addDoc(collection(db, 'popup_campaigns'), {
            title: 'Early Bird Discount',
            content: 'Get 15% off your next booking when you sign up today!',
            type: 'discount',
            trigger: 'exit_intent',
            isActive: true,
            createdAt: new Date().toISOString()
          });
        }

        // Seed Calendar Events
        if (calendarEvents.length === 0) {
          const events = [
            { title: 'Santorini Group Trip', start: new Date(2026, 2, 28).toISOString(), end: new Date(2026, 3, 5).toISOString(), type: 'booking', description: 'Group of 12' },
            { title: 'Staff Training', start: new Date(2026, 2, 27, 10, 0).toISOString(), end: new Date(2026, 2, 27, 12, 0).toISOString(), type: 'staff_schedule', description: 'New CMS features' }
          ];
          for (const event of events) {
            await addDoc(collection(db, 'calendar_events'), event);
          }
        }
      };
      seedData();
    }
  }, [profile, wpPosts.length, customForms.length, popupCampaigns.length, calendarEvents.length]);

  const onBookingSuccess = () => {
    setIsBookingModalOpen(false);
    setSelectedPackage(null);
    setActiveTab('bookings');
  };

  const handleCreatePackage = async () => {
    if (profile?.role !== 'admin') return;
    
    const samplePackages = [
      {
        title: "Dubai Luxury Experience",
        description: "Experience the ultimate luxury in Dubai with private desert safaris, Burj Khalifa tours, and yacht cruises.",
        destination: "Dubai, UAE",
        price: 2499,
        duration: "5 Days",
        imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        title: "Italian Riviera Escape",
        description: "Explore the stunning coastline of Cinque Terre and Portofino with wine tasting and private boat tours.",
        destination: "Italy",
        price: 3200,
        duration: "7 Days",
        imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        title: "Parisian Romance",
        description: "A romantic getaway in the heart of Paris, including Seine cruises and Michelin-starred dining.",
        destination: "France",
        price: 1850,
        duration: "4 Days",
        imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    const sampleAccommodations = [
      { name: "Burj Al Arab", type: "hotel", location: "Dubai", pricePerNight: 1500, amenities: ["Spa", "Private Beach", "Butler Service"], availability: true },
      { name: "Villa d'Este", type: "villa", location: "Lake Como, Italy", pricePerNight: 2000, amenities: ["Pool", "Garden", "Lake View"], availability: true },
      { name: "Hôtel Plaza Athénée", type: "hotel", location: "Paris", pricePerNight: 1200, amenities: ["Fine Dining", "Spa", "City View"], availability: true }
    ];

    const sampleTransports = [
      { type: "car", model: "Rolls Royce Phantom", capacity: 4, pricePerDay: 800, availability: true },
      { type: "private_jet", model: "Gulfstream G650", capacity: 14, pricePerDay: 15000, availability: true },
      { type: "shuttle", model: "Mercedes V-Class", capacity: 7, pricePerDay: 300, availability: true }
    ];

    try {
      for (const pkg of samplePackages) {
        await addDoc(collection(db, 'packages'), pkg);
      }
      for (const acc of sampleAccommodations) {
        await addDoc(collection(db, 'accommodations'), acc);
      }
      for (const trans of sampleTransports) {
        await addDoc(collection(db, 'transports'), trans);
      }
      
      // Seed some tasks for admin
      const sampleTasks = [
        { title: "Review new booking requests", assignedTo: profile.uid, status: "todo", priority: "high", dueDate: new Date().toISOString(), createdAt: new Date().toISOString() },
        { title: "Update Dubai package pricing", assignedTo: profile.uid, status: "in_progress", priority: "medium", dueDate: new Date().toISOString(), createdAt: new Date().toISOString() }
      ];
      for (const task of sampleTasks) {
        await addDoc(collection(db, 'tasks'), task);
      }

      alert("Sample data seeded successfully!");
    } catch (error) {
      console.error("Failed to seed data", error);
      alert("Failed to seed data. Check console for errors.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white font-sans selection:bg-amber-100 selection:text-amber-900">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                <Globe className="text-white" size={20} />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900">FIEZTA</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#destinations" className="text-sm font-semibold text-slate-600 hover:text-[#D4AF37] transition-colors">Destinations</a>
              <a href="#services" className="text-sm font-semibold text-slate-600 hover:text-[#D4AF37] transition-colors">Services</a>
              <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-[#D4AF37] transition-colors">About</a>
              <button 
                onClick={handleLogin}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-[#D4AF37] transition-all shadow-lg shadow-slate-200"
              >
                Sign In
              </button>
            </div>
            
            <button className="md:hidden p-2 text-slate-600">
              <Menu size={24} />
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-4 py-1.5 bg-amber-50 text-[#D4AF37] rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-amber-200">
                  Royal Precision. Elite Travel.
                </span>
                <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9] mb-8">
                  The <span className="text-[#D4AF37]">Gold</span> Standard of Travel.
                </h1>
                <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-xl">
                  Bespoke luxury escapes and elite concierge services. Fiezta automates your travel planning with royal precision.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleLogin}
                    className="px-8 py-4 bg-[#D4AF37] text-white rounded-2xl font-bold text-lg hover:bg-amber-600 transition-all shadow-xl shadow-amber-200 flex items-center justify-center gap-2"
                  >
                    Start Planning <ChevronRight size={20} />
                  </button>
                  <a 
                    href="#destinations"
                    className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center"
                  >
                    View Destinations
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative w-full h-full"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-50 rounded-full blur-3xl opacity-50"></div>
              <img 
                src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80" 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[700px] object-cover rounded-[40px] shadow-2xl rotate-3 border-8 border-white"
                alt="Travel"
                referrerPolicy="no-referrer"
              />
              <img 
                src="https://images.unsplash.com/photo-1506929199175-6093a423f505?auto=format&fit=crop&w=800&q=80" 
                className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] object-cover rounded-[30px] shadow-2xl -rotate-6 border-8 border-white"
                alt="Travel"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-black text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent"></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              <div>
                <h3 className="text-5xl font-black mb-2 text-[#D4AF37]">12k+</h3>
                <p className="text-slate-400 font-medium">Happy Travelers</p>
              </div>
              <div>
                <h3 className="text-5xl font-black mb-2 text-[#D4AF37]">45+</h3>
                <p className="text-slate-400 font-medium">Destinations</p>
              </div>
              <div>
                <h3 className="text-5xl font-black mb-2 text-[#D4AF37]">99%</h3>
                <p className="text-slate-400 font-medium">Satisfaction Rate</p>
              </div>
              <div>
                <h3 className="text-5xl font-black mb-2 text-[#D4AF37]">24/7</h3>
                <p className="text-slate-400 font-medium">AI Support</p>
              </div>
            </div>
          </div>
        </section>

        {/* Destinations Grid */}
        <section id="destinations" className="py-32 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-6 uppercase">Featured <span className="text-[#D4AF37]">Collections</span></h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">Explore our hand-picked luxury packages designed for the ultimate travel experience.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.length > 0 ? packages.map((pkg, idx) => (
                <motion.div 
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 group"
                >
                  <div className="relative h-72 overflow-hidden">
                    <img 
                      src={pkg.imageUrl || `https://picsum.photos/seed/${pkg.destination}/800/600`} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={pkg.title} 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-6 right-6 bg-[#D4AF37] px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg">
                      {pkg.duration}
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-2 text-[#D4AF37] mb-3">
                      <Globe size={16} />
                      <span className="text-xs font-black uppercase tracking-widest">{pkg.destination}</span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-3">{pkg.title}</h4>
                    <p className="text-slate-500 mb-8 line-clamp-2">{pkg.description}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Starting from</p>
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(pkg.price)}</span>
                      </div>
                      <button 
                        onClick={handleLogin}
                        className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-[#D4AF37] transition-all"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">New destinations arriving soon...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="services" className="py-32 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-5xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 leading-tight">
                  Why Fiezta is the <span className="text-[#D4AF37]">Standard</span> of Luxury.
                </h2>
                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="w-14 h-14 bg-amber-50 text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 border border-amber-100">
                      <Sparkles size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2">AI-Powered Itineraries</h4>
                      <p className="text-slate-500">Our advanced AI generates personalized travel plans based on your preferences and budget in seconds.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-14 h-14 bg-amber-50 text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 border border-amber-100">
                      <CreditCard size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2">Seamless Payments</h4>
                      <p className="text-slate-500">Secure, automated invoicing and payment tracking for a stress-free booking experience.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-14 h-14 bg-amber-50 text-[#D4AF37] rounded-2xl flex items-center justify-center shrink-0 border border-amber-100">
                      <Users size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2">Dedicated Concierge</h4>
                      <p className="text-slate-500">Access to professional travel agents and 24/7 support for all your needs.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-50"></div>
                <div className="relative bg-black rounded-[40px] p-8 shadow-2xl border border-amber-500/20">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center">
                        <Sparkles className="text-white" size={20} />
                      </div>
                      <span className="text-white font-bold">AI Concierge</span>
                    </div>
                    <div className="px-3 py-1 bg-[#D4AF37]/20 rounded-full text-xs text-[#D4AF37] font-medium uppercase tracking-widest">Live</div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-white/60 text-xs mb-1 uppercase font-bold">User</p>
                      <p className="text-white text-sm italic">"Plan a 3-day luxury trip to Paris..."</p>
                    </div>
                    <div className="bg-[#D4AF37]/20 p-4 rounded-2xl shadow-lg border border-[#D4AF37]/30">
                      <p className="text-[#D4AF37] text-xs mb-1 uppercase font-bold">Fiezta AI</p>
                      <p className="text-white text-sm">"I've designed a romantic itinerary including a private Louvre tour and Seine dinner cruise. Total budget: $1,850."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 py-20 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                    <Globe className="text-white" size={20} />
                  </div>
                  <span className="text-2xl font-black tracking-tighter text-slate-900">FIEZTA</span>
                </div>
                <p className="text-slate-500 max-w-sm leading-relaxed">
                  Transforming the way you travel with automation, AI, and dedicated concierge services. Your journey starts here.
                </p>
              </div>
              <div>
                <h5 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Company</h5>
                <ul className="space-y-4">
                  <li><a href="#" className="text-slate-500 hover:text-[#D4AF37] transition-colors">About Us</a></li>
                  <li><a href="#" className="text-slate-500 hover:text-[#D4AF37] transition-colors">Careers</a></li>
                  <li><a href="#" className="text-slate-500 hover:text-[#D4AF37] transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Support</h5>
                <ul className="space-y-4">
                  <li><a href="#" className="text-slate-500 hover:text-[#D4AF37] transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-slate-500 hover:text-[#D4AF37] transition-colors">Contact Us</a></li>
                  <li><a href="#" className="text-slate-500 hover:text-[#D4AF37] transition-colors">Status</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-slate-400 text-sm">© 2026 Fiezta CMS. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="text-slate-400 hover:text-[#D4AF37] transition-colors"><Facebook size={20} /></a>
                <a href="#" className="text-slate-400 hover:text-[#D4AF37] transition-colors"><Instagram size={20} /></a>
                <a href="#" className="text-slate-400 hover:text-[#D4AF37] transition-colors"><Twitter size={20} /></a>
                <a href="#" className="text-slate-400 hover:text-[#D4AF37] transition-colors"><Youtube size={20} /></a>
                <a href="#" className="text-slate-400 hover:text-[#D4AF37] transition-colors"><Linkedin size={20} /></a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-white border-r border-slate-200 flex flex-col relative z-20"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100">
            <Globe className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold text-slate-900 truncate">Fiezta CMS</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Briefcase} 
            label="Packages" 
            active={activeTab === 'packages'} 
            onClick={() => setActiveTab('packages')} 
          />
          <SidebarItem 
            icon={Calendar} 
            label="Bookings" 
            active={activeTab === 'bookings'} 
            onClick={() => setActiveTab('bookings')} 
          />
          
          <SidebarItem 
            icon={CalendarDays} 
            label="Scheduling" 
            active={activeTab === 'scheduling'} 
            onClick={() => setActiveTab('scheduling')} 
          />
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marketing</div>
          
          <SidebarItem 
            icon={MousePointer2} 
            label="Forms & Popups" 
            active={activeTab === 'marketing'} 
            onClick={() => setActiveTab('marketing')} 
          />
          <SidebarItem 
            icon={Layout} 
            label="WordPress CMS" 
            active={activeTab === 'cms'} 
            onClick={() => setActiveTab('cms')} 
          />
          <SidebarItem 
            icon={Smartphone} 
            label="Social Scheduler" 
            active={activeTab === 'social'} 
            onClick={() => setActiveTab('social')} 
          />
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management</div>
          
          <SidebarItem 
            icon={Hotel} 
            label="Accommodations" 
            active={activeTab === 'accommodations'} 
            onClick={() => setActiveTab('accommodations')} 
          />
          <SidebarItem 
            icon={Car} 
            label="Transport" 
            active={activeTab === 'transport'} 
            onClick={() => setActiveTab('transport')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Invoices" 
            active={activeTab === 'invoices'} 
            onClick={() => setActiveTab('invoices')} 
          />
          <SidebarItem 
            icon={FileCheck} 
            label="Documents" 
            active={activeTab === 'documents'} 
            onClick={() => setActiveTab('documents')} 
          />
          <SidebarItem 
            icon={Activity} 
            label="Audit Logs" 
            active={activeTab === 'audit'} 
            onClick={() => setActiveTab('audit')} 
          />

          {(profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'agent') && (
            <>
              <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin</div>
              <SidebarItem 
                icon={Users} 
                label="Clients" 
                active={activeTab === 'clients'} 
                onClick={() => setActiveTab('clients')} 
              />
              <SidebarItem 
                icon={UserPlus} 
                label="Staff" 
                active={activeTab === 'staff'} 
                onClick={() => setActiveTab('staff')} 
              />
              <SidebarItem 
                icon={CheckSquare} 
                label="Tasks" 
                active={activeTab === 'tasks'} 
                onClick={() => setActiveTab('tasks')} 
              />
              <SidebarItem 
                icon={MessageSquare} 
                label="Messages" 
                active={activeTab === 'messages'} 
                onClick={() => setActiveTab('messages')} 
              />
              <SidebarItem 
                icon={CreditCard} 
                label="Payments" 
                active={activeTab === 'payments'} 
                onClick={() => setActiveTab('payments')} 
              />
            </>
          )}

          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System</div>
          <SidebarItem 
            icon={Sparkles} 
            label="AI Assistant" 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
          />
          <SidebarItem 
            icon={Mail} 
            label="Newsletter" 
            active={activeTab === 'newsletter'} 
            onClick={() => setActiveTab('newsletter')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <img 
              src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
              className="w-10 h-10 rounded-full border-2 border-slate-100" 
              alt="Avatar" 
            />
            <div className="flex-1 truncate">
              <p className="text-sm font-bold text-slate-900 truncate">{profile?.displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-lg font-bold text-slate-900 capitalize">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative">
              <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></div>
              <AlertCircle size={20} />
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Header with Export */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Control Center</h1>
                    <p className="text-slate-500 text-sm">Real-time overview of Fiezta's performance and operations.</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                      <Download size={18} />
                      Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                      <TrendingUp size={18} />
                      Generate Report
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <DollarSign size={24} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+18.2%</span>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">vs last month</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Revenue</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">
                      {formatCurrency(bookings.reduce((acc, b) => acc + (b.paidAmount || 0), 0))}
                    </h3>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Briefcase size={24} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">+5.4%</span>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">vs last month</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Bookings</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{bookings.length}</h3>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users size={24} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Active</span>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">currently online</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Active Clients</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{clients.length}</h3>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Award size={24} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">98%</span>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">satisfaction</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Success Rate</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">94.2%</h3>
                  </div>
                </div>

                {/* Charts & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900">Revenue Growth</h3>
                        <p className="text-slate-500 text-sm">Monthly performance tracking.</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">1W</button>
                        <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100">1M</button>
                        <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">1Y</button>
                      </div>
                    </div>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'Jan', value: 4000 },
                          { name: 'Feb', value: 3000 },
                          { name: 'Mar', value: 5000 },
                          { name: 'Apr', value: 4500 },
                          { name: 'May', value: 6000 },
                          { name: 'Jun', value: 5500 },
                          { name: 'Jul', value: 7000 },
                        ]}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            itemStyle={{ fontWeight: 800, color: '#4f46e5' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black tracking-tight text-slate-900">Live Activity</h3>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Real-time</span>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {activityLogs.length > 0 ? activityLogs.slice(0, 6).map((log) => (
                        <div key={log.id} className="flex gap-4 relative">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            <Activity size={18} className="text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 leading-tight">
                              <span className="text-indigo-600">{log.userName}</span> {log.action}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 truncate">{log.details}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Activity size={24} className="text-slate-300" />
                          </div>
                          <p className="text-slate-400 text-sm font-medium">No activity recorded yet.</p>
                        </div>
                      )}
                    </div>
                    <button className="w-full mt-8 py-3 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
                      View Audit Log
                    </button>
                  </div>
                </div>

                {/* Recent Bookings Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Recent Bookings</h3>
                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Package</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.slice(0, 5).map((booking) => (
                          <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                  {booking.clientName.charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-slate-900">{booking.clientName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{booking.packageName}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{new Date(booking.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4"><StatusBadge status={booking.status} /></td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(booking.totalAmount)}</td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                <ChevronRight size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'packages' && (
              <motion.div 
                key="packages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Travel Packages</h3>
                  {profile?.role === 'admin' ? (
                    <button 
                      onClick={handleCreatePackage}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                      <Plus size={20} />
                      Seed Packages
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 text-sm italic">
                      <AlertCircle size={16} />
                      Only admins can manage packages
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.length > 0 ? packages.map((pkg) => (
                    <motion.div 
                      key={pkg.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={pkg.imageUrl || `https://picsum.photos/seed/${pkg.destination}/800/600`} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          alt={pkg.title} 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-600">
                          {pkg.duration}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-indigo-600 mb-2">
                          <Globe size={14} />
                          <span className="text-xs font-bold uppercase tracking-wider">{pkg.destination}</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2">{pkg.title}</h4>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{pkg.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <span className="text-xl font-bold text-slate-900">{formatCurrency(pkg.price)}</span>
                          <button 
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setIsBookingModalOpen(true);
                            }}
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full py-20 text-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Briefcase size={32} />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">No packages found</h4>
                      <p className="text-slate-500">Start by adding your first travel package.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col max-w-4xl mx-auto"
              >
                <div className="bg-indigo-600 p-8 rounded-t-3xl text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                      <Sparkles size={28} />
                      Fiezta AI Concierge
                    </h3>
                    <p className="text-indigo-100 opacity-90">Ask me anything about travel planning, itineraries, or destination advice.</p>
                  </div>
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Globe size={120} />
                  </div>
                </div>

                <div className="flex-1 bg-white border-x border-slate-200 p-6 overflow-y-auto space-y-6">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                        <Sparkles size={32} />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">How can I help you today?</h4>
                      <p className="text-slate-500 mt-2 max-w-xs">Try asking: "Plan a 5-day trip to Dubai on a $2000 budget" or "What are the visa requirements for Italy?"</p>
                    </div>
                  )}
                  
                  {chatMessages.map((msg, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex gap-4 max-w-[80%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        msg.role === 'user' ? "bg-indigo-600 text-white" : "bg-slate-100 text-indigo-600"
                      )}>
                        {msg.role === 'user' ? <Users size={16} /> : <Sparkles size={16} />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isAiLoading && (
                    <div className="flex gap-4 mr-auto">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Loader2 size={16} className="animate-spin" />
                      </div>
                      <div className="p-4 bg-slate-100 rounded-2xl rounded-tl-none flex gap-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-b-3xl">
                  <form onSubmit={handleAiChat} className="relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your travel query..." 
                      className="w-full pl-6 pr-14 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all outline-none"
                    />
                    <button 
                      type="submit"
                      disabled={isAiLoading || !chatInput.trim()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'bookings' && (
              <motion.div 
                key="bookings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">My Bookings</h3>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Package</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Travel Date</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.length > 0 ? bookings.map((booking) => (
                          <tr 
                            key={booking.id} 
                            className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedBookingDetail(booking);
                              setIsBookingDetailModalOpen(true);
                            }}
                          >
                            <td className="px-6 py-4 text-sm font-mono text-slate-500">#{booking.id.slice(0, 8)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{booking.packageName}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{new Date(booking.travelDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4"><StatusBadge status={booking.status} /></td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(booking.totalAmount)}</td>
                            <td className="px-6 py-4 text-right">
                              <button className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                                Details
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-20 text-center">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Calendar size={24} />
                              </div>
                              <p className="text-slate-500">You don't have any bookings yet.</p>
                              <button 
                                onClick={() => setActiveTab('packages')}
                                className="mt-4 text-indigo-600 font-bold hover:underline"
                              >
                                Browse Packages
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div 
                key="messages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-[calc(100vh-12rem)] flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Internal Messaging</h1>
                    <p className="text-slate-500 text-sm">Secure communication between staff members.</p>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                    <Plus size={20} />
                    New Message
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="Search conversations..."
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {messages.length > 0 ? messages.map((msg) => (
                        <div key={msg.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0">
                            {msg.senderName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-black text-slate-900 truncate">{msg.senderName}</h4>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{msg.content}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-12 text-center text-slate-400">
                          <MessageSquare size={32} className="mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-bold">No messages yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black">
                          S
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">Support Team</h3>
                          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Online
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs shrink-0">S</div>
                        <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                          <p className="text-sm text-slate-700">Hi team, we have a new booking for the Santorini package. Can someone check the availability for the luxury villa?</p>
                        </div>
                      </div>
                      <div className="flex gap-3 flex-row-reverse">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0">Y</div>
                        <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none max-w-[80%] text-white shadow-lg shadow-indigo-100">
                          <p className="text-sm">I'm on it! Checking with the provider now.</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 border-t border-slate-100">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Type your message..."
                          className="w-full pl-6 pr-14 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        />
                        <button className="absolute right-2 top-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'newsletter' && (
              <motion.div 
                key="newsletter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Newsletter & Marketing</h1>
                    <p className="text-slate-500 text-sm">Manage subscribers and automated notifications.</p>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                    <Send size={20} />
                    Create Campaign
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900">Subscribers</h3>
                      <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                        {subscribers.length} Total
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Subscriber</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Joined</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {subscribers.map((sub) => (
                            <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                    {sub.email.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium text-slate-700">{sub.email}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={sub.status} />
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {new Date(sub.subscribedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <button className="text-slate-400 hover:text-red-500 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900 mb-4">Automation Rules</h3>
                      <div className="space-y-4">
                        {[
                          { title: 'Booking Confirmation', icon: CheckCircle2, color: 'text-green-500' },
                          { title: 'Payment Reminders', icon: Clock, color: 'text-amber-500' },
                          { title: 'Travel Updates', icon: Plane, color: 'text-indigo-500' },
                          { title: 'Welcome Series', icon: Heart, color: 'text-rose-500' }
                        ].map((rule, idx) => {
                          const Icon = rule.icon;
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 hover:border-indigo-100 transition-all cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-slate-50 ${rule.color}`}>
                                  <Icon size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{rule.title}</span>
                              </div>
                              <div className="w-10 h-5 bg-indigo-600 rounded-full relative">
                                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-lg shadow-indigo-100">
                      <h3 className="text-lg font-black mb-2">SMS & WhatsApp</h3>
                      <p className="text-indigo-100 text-xs mb-4 leading-relaxed">
                        Integrate Twilio or Meta API to send real-time alerts to your clients directly on their mobile devices.
                      </p>
                      <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-sm font-bold transition-all border border-white/20">
                        Configure Integration
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'accommodations' && (
              <motion.div 
                key="accommodations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Accommodations</h1>
                    <p className="text-slate-500 text-sm">Manage hotels, apartments, and availability.</p>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                    <Plus size={20} />
                    Add Accommodation
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accommodations.map((acc) => (
                    <div key={acc.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      <div className="h-48 bg-slate-200 relative">
                        <img src={acc.imageUrl || 'https://picsum.photos/seed/hotel/800/600'} className="w-full h-full object-cover" alt={acc.name} />
                        <div className="absolute top-4 right-4">
                          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm uppercase tracking-widest">
                            {acc.type}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-black text-slate-900 mb-1">{acc.name}</h3>
                        <p className="text-slate-500 text-sm flex items-center gap-1 mb-4">
                          <MapPin size={14} className="text-[#D4AF37]" />
                          {acc.location}
                        </p>
                        <div className="flex items-center justify-between py-4 border-t border-slate-100">
                          <div>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(acc.pricePerNight)}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">per night</p>
                          </div>
                          <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all">
                            Manage Pricing
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'transport' && (
              <motion.div 
                key="transport"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Transport Fleet</h1>
                    <p className="text-slate-500 text-sm">Manage vehicles, flights, and logistics.</p>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                    <Plus size={20} />
                    Add Vehicle
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {transport.map((item) => (
                    <div key={item.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      <div className="h-48 bg-slate-200 relative">
                        <img src={item.imageUrl || 'https://picsum.photos/seed/car/800/600'} className="w-full h-full object-cover" alt={item.provider} />
                        <div className="absolute top-4 right-4">
                          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm uppercase tracking-widest">
                            {item.type}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-black text-slate-900 mb-1">{item.provider} {item.model}</h3>
                        <p className="text-slate-500 text-sm flex items-center gap-1 mb-4">
                          <Users size={14} className="text-[#D4AF37]" />
                          Capacity: {item.capacity} Persons
                        </p>
                        <div className="flex items-center justify-between py-4 border-t border-slate-100">
                          <div>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(item.price)}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">base price</p>
                          </div>
                          <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all">
                            Check Availability
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-[calc(100vh-12rem)] flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">AI Travel Assistant</h1>
                    <p className="text-slate-500 text-sm">Intelligent itinerary generation and admin support.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gemini 3 Flash Online</span>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                  <div className="lg:col-span-3 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
                          <Sparkles size={20} />
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            Hello! I'm your Fiezta AI Assistant. I can help you generate travel itineraries, optimize budgets, or provide admin insights. What can I do for you today?
                          </p>
                        </div>
                      </div>

                      {/* Example AI Response */}
                      <div className="flex gap-4 flex-row-reverse">
                        <div className="w-10 h-10 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-100">
                          <UserIcon size={20} />
                        </div>
                        <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none max-w-[80%] text-white">
                          <p className="text-sm leading-relaxed">
                            Generate a 3-day luxury itinerary for a couple visiting Santorini.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                          <Sparkles size={20} />
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl rounded-tl-none max-w-[90%] space-y-4">
                          <div className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest">
                            <Plane size={16} />
                            Santorini Luxury Escape
                          </div>
                          <div className="space-y-3">
                            <div className="p-3 bg-white rounded-xl border border-slate-100">
                              <span className="text-[10px] font-black text-indigo-600 uppercase">Day 1: Oia Sunset & Fine Dining</span>
                              <p className="text-xs text-slate-500 mt-1">Private transfer to Canaves Oia Luxury Resort. Afternoon sailing on a private catamaran. Dinner at Lycabettus Restaurant.</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-slate-100">
                              <span className="text-[10px] font-black text-indigo-600 uppercase">Day 2: Wine Tasting & Caldera Views</span>
                              <p className="text-xs text-slate-500 mt-1">Guided tour of Santo Wines. Private infinity pool relaxation. Sunset cocktails at Franco's Bar.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50/30">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Ask AI to generate an itinerary or report..."
                          className="w-full pl-6 pr-16 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                        />
                        <button className="absolute right-2 top-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Generate Itinerary', icon: MapIcon },
                          { label: 'Budget Optimization', icon: DollarSign },
                          { label: 'Pending Bookings', icon: Clock },
                          { label: 'Revenue Report', icon: BarChart3 }
                        ].map((action, idx) => {
                          const Icon = action.icon;
                          return (
                            <button key={idx} className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
                              <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white text-slate-400 group-hover:text-indigo-600 transition-all">
                                <Icon size={18} />
                              </div>
                              <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{action.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-[32px] text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-white/10">
                          <Zap size={20} className="text-amber-400" />
                        </div>
                        <h3 className="text-lg font-black">AI Insights</h3>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed mb-4">
                        "Bookings for Santorini are up 24% this month. Consider launching a targeted promotion for luxury villas to maximize revenue."
                      </p>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-amber-400"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'invoices' && (
              <motion.div 
                key="invoices"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Invoices & Billing</h3>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-slate-500">#{inv.id.slice(0, 8)}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(inv.amount)}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-lg text-xs font-bold",
                              inv.status === 'paid' ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                            )}>
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-indigo-600 font-bold text-sm hover:underline">View PDF</button>
                          </td>
                        </tr>
                      ))}
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No invoices found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'documents' && (
              <motion.div 
                key="documents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">My Documents</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                    <Plus size={20} />
                    Upload Document
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-4">
                        <FileText size={32} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 truncate w-full">{doc.fileName}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{doc.type}</p>
                      <button className="mt-4 w-full py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all">
                        Download
                      </button>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500">No documents uploaded yet.</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'staff' && (
              <motion.div 
                key="staff"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Staff Management</h1>
                    <p className="text-slate-500 text-sm">Manage roles, assign tasks, and track performance.</p>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                    <UserPlus size={20} />
                    Add Staff Member
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {staff.map((member) => (
                    <div key={member.uid} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 mb-6">
                        <img 
                          src={member.photoURL || `https://ui-avatars.com/api/?name=${member.displayName}`} 
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50"
                          alt={member.displayName}
                        />
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 leading-tight">{member.displayName}</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{member.role.replace('_', ' ')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Bookings</p>
                          <p className="text-lg font-black text-slate-900">{member.performanceMetrics?.bookingsHandled || 0}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Rating</p>
                          <p className="text-lg font-black text-emerald-600">{member.performanceMetrics?.customerRating || 5.0}★</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                          <CheckSquare size={16} />
                          Assign Task
                        </button>
                        <button className="w-full py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                          <MessageSquare size={16} />
                          Send Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {activeTab === 'crm' && (
              <motion.div 
                key="clients"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Client Management (CRM)</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200">
                    <Plus size={20} />
                    Add Client
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Clients</p>
                    <p className="text-3xl font-black text-slate-900">{clients.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Bookings</p>
                    <p className="text-3xl font-black text-[#D4AF37]">{bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-3xl font-black text-emerald-600">{formatCurrency(bookings.reduce((acc, b) => acc + b.paidAmount, 0))}</p>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search clients by name, email or preferences..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Preferences</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">AI Insights</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.map((client) => (
                        <tr key={client.uid} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={client.photoURL || `https://ui-avatars.com/api/?name=${client.displayName}`} className="w-10 h-10 rounded-xl" alt="" />
                              <div>
                                <span className="block text-sm font-bold text-slate-900">{client.displayName}</span>
                                <span className="block text-[10px] text-slate-400 font-medium">{client.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {client.preferences?.destinations?.slice(0, 2).map((d, i) => (
                                <span key={i} className="text-[9px] font-bold bg-amber-50 text-[#D4AF37] px-1.5 py-0.5 rounded uppercase">{d}</span>
                              ))}
                              {client.preferences?.budget && (
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{client.preferences.budget}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-[200px]">
                              <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                                {client.aiInsights || "No insights generated yet."}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              client.role === 'admin' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-500 border-slate-100"
                            )}>
                              {client.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => generateAIInsights(client)}
                                className="p-2 text-slate-400 hover:text-[#D4AF37] transition-colors"
                                title="Generate AI Insights"
                              >
                                <Sparkles size={16} />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-[#D4AF37] transition-colors">
                                <Edit2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Staff Tasks</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                    <Plus size={20} />
                    New Task
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tasks.map((task) => (
                    <div key={task.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          task.priority === 'high' ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50"
                        )}>
                          {task.priority} Priority
                        </span>
                        <span className="text-xs text-slate-400">{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">{task.title}</h4>
                      <p className="text-sm text-slate-500 mb-4">{task.description || 'No description provided.'}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            task.status === 'done' ? "bg-emerald-500" : task.status === 'in_progress' ? "bg-blue-500" : "bg-slate-300"
                          )}></div>
                          <span className="text-xs font-bold text-slate-600 uppercase">{task.status.replace('_', ' ')}</span>
                        </div>
                        <button className="text-indigo-600 font-bold text-sm hover:underline">Update</button>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500">No tasks assigned.</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div 
                key="payments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">Payment Transactions</h3>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm">
                      Total Collected: {formatCurrency(bookings.reduce((acc, b) => acc + b.paidAmount, 0))}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.filter(b => b.paidAmount > 0).map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-slate-500">#{b.id.slice(0, 8)}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{b.clientName}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(b.paidAmount)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase">
                              Success
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{new Date(b.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {bookings.filter(b => b.paidAmount > 0).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No payment transactions found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'documents' && (
              <motion.div 
                key="documents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Document Management</h1>
                    <p className="text-slate-500 text-sm">Secure storage for passports, visas, and travel tickets.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                      <PlusCircle size={18} />
                      Upload Document
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.length > 0 && documents.map((doc) => (
                    <div key={doc.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                          {doc.type === 'passport' ? <ShieldCheck size={24} /> : 
                           doc.type === 'visa' ? <Globe size={24} /> : 
                           <FileText size={24} />}
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Download size={16} /></button>
                          <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">{doc.title}</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">{doc.type}</span>
                        {doc.expiryDate && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                            new Date(doc.expiryDate) < new Date() ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            Exp: {new Date(doc.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                            <UserIcon size={12} className="text-slate-400" />
                          </div>
                          <span className="text-xs text-slate-500 font-medium">{doc.clientName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{doc.fileSize}</span>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="col-span-full bg-white p-12 rounded-[32px] border-2 border-dashed border-slate-200 text-center">
                      <FileCheck className="mx-auto mb-4 text-slate-300" size={48} />
                      <p className="font-bold text-slate-500">No documents uploaded yet.</p>
                      <p className="text-sm text-slate-400 mt-1">Upload passports, visas, or tickets for secure access.</p>
                      <button className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all">
                        Upload First Document
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'cms' && (
              <motion.div 
                key="cms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">WordPress Integration</h1>
                    <p className="text-slate-500 text-sm">Connect your blog and sync content via Headless CMS approach.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                      <RefreshCw size={18} />
                      Sync Content
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                      <Settings size={18} />
                      WP Config
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Synced Blog Posts</h3>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase">Live Sync Active</span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {wpPosts.length > 0 ? wpPosts.map((post) => (
                          <div key={post.id} className="p-6 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{post.title}</h4>
                                <p className="text-sm text-slate-500 line-clamp-2">{post.excerpt}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(post.date).toLocaleDateString()}</span>
                                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">{post.status}</span>
                                </div>
                              </div>
                              <a href={post.link} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                <ExternalLink size={18} />
                              </a>
                            </div>
                          </div>
                        )) : (
                          <div className="p-12 text-center text-slate-400">
                            <RefreshCw className="mx-auto mb-4 animate-spin-slow" size={32} />
                            <p className="font-bold">No posts synced yet.</p>
                            <p className="text-xs mt-1">Check your WP configuration or click Sync Content.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900 mb-4">WP Bridge Status</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                              <RefreshCw size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase">API Status</p>
                              <p className="text-sm font-bold text-slate-900">{wpConfig.status === 'connected' ? 'Connected' : 'Disconnected'}</p>
                            </div>
                          </div>
                          <div className={cn("w-3 h-3 rounded-full", wpConfig.status === 'connected' ? "bg-emerald-500" : "bg-rose-500")}></div>
                        </div>
                        <div className="p-4 border border-slate-100 rounded-2xl space-y-2">
                          <p className="text-xs font-bold text-slate-400 uppercase">Endpoint URL</p>
                          <p className="text-sm font-mono text-slate-600 truncate">{wpConfig.url || 'Not configured'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-[32px] text-white">
                      <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                        <Layers size={20} className="text-amber-400" />
                        Theme Bridge
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed mb-6">
                        Import your WordPress theme styles and layouts directly into Fiezta for a unified brand experience.
                      </p>
                      <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-sm font-bold transition-all border border-white/10">
                        Import Theme Assets
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'social' && (
              <SocialDashboard agencyId="agency_123" />
            )}

            {activeTab === 'audit' && (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Audit Logs</h1>
                    <p className="text-slate-500 text-sm">Security-focused activity tracking for compliance and monitoring.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Details'];
                        const data = auditLogs.map(log => [
                          new Date(log.timestamp).toLocaleString(),
                          log.userName,
                          log.action,
                          log.resourceType,
                          log.details || ''
                        ]);
                        exportToPDF(headers, data, 'audit-logs', 'Fiezta Audit Logs');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <Download size={18} />
                      Export Logs
                    </button>
                    <button className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs.length > 0 ? auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                                  {log.userName.charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{log.userName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                log.action.includes('DELETE') ? "bg-rose-50 text-rose-600" : 
                                log.action.includes('CREATE') ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                              )}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-500">{log.resourceType}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-slate-400 truncate max-w-[200px]">{log.details || '-'}</p>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                              <Activity size={48} className="mx-auto text-slate-200 mb-4" />
                              <p className="text-slate-400">No audit logs found.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'marketing' && (
              <motion.div 
                key="marketing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Marketing & Growth</h1>
                    <p className="text-slate-500 text-sm">Manage coupons, referrals, and loyalty programs to grow your agency.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Coupons Section */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <Zap size={18} className="text-amber-500" />
                          Active Coupons
                        </h3>
                        <button className="text-xs font-bold text-indigo-600 hover:underline">Create New</button>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {coupons.length > 0 ? coupons.map(coupon => (
                          <div key={coupon.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black text-lg">
                                %
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{coupon.code}</h4>
                                <p className="text-xs text-slate-500">
                                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `$${coupon.discountValue} off`} • 
                                  Expires {new Date(coupon.expiryDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-400 block mb-1">Redemptions</span>
                              <span className="text-sm font-black text-slate-900">{coupon.usageCount} / {coupon.usageLimit || '∞'}</span>
                            </div>
                          </div>
                        )) : (
                          <div className="p-12 text-center text-slate-400">
                            <p>No active coupons found.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Affiliate Section */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                      <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Users size={24} className="text-indigo-600" />
                        Affiliate Program
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-6 bg-slate-50 rounded-3xl">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Affiliates</p>
                          <p className="text-2xl font-black text-slate-900">24</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pending Payouts</p>
                          <p className="text-2xl font-black text-slate-900">$1,240</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Conversion Rate</p>
                          <p className="text-2xl font-black text-slate-900">4.2%</p>
                        </div>
                      </div>
                      <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                        Manage Affiliates
                      </button>
                    </div>
                  </div>

                  {/* Loyalty Section */}
                  <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-200">
                      <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                        <Award size={24} className="text-amber-400" />
                        Loyalty Points
                      </h3>
                      <p className="text-slate-400 text-sm mb-6">Configure how your customers earn and spend points.</p>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-sm font-bold">Points per $1</span>
                          <span className="text-sm font-black text-amber-400">10 pts</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                          <span className="text-sm font-bold">Redemption Rate</span>
                          <span className="text-sm font-black text-amber-400">100 pts = $1</span>
                        </div>
                        <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
                          Edit Rules
                        </button>
                      </div>
                    </div>

                    <div className="bg-indigo-50 rounded-[32px] p-8 border border-indigo-100">
                      <h3 className="font-bold text-indigo-900 mb-2">Referral Bonus</h3>
                      <p className="text-indigo-600 text-sm mb-4">Give $20, Get $20. Boost your organic growth with our built-in referral system.</p>
                      <div className="p-4 bg-white rounded-2xl border border-indigo-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Active Campaign</span>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'scheduling' && (
              <motion.div 
                key="scheduling"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Scheduling & Calendar</h1>
                    <p className="text-slate-500 text-sm">Manage bookings, staff schedules, and travel timelines.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                      <PlusCircle size={18} />
                      New Event
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3">
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <h3 className="text-xl font-bold text-slate-900">March 2026</h3>
                          <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-all"><ChevronRight className="rotate-180" size={18} /></button>
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-all"><ChevronRight size={18} /></button>
                          </div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button className="px-4 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-sm">Month</button>
                          <button className="px-4 py-1.5 text-slate-500 rounded-lg text-xs font-bold">Week</button>
                          <button className="px-4 py-1.5 text-slate-500 rounded-lg text-xs font-bold">Day</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="bg-slate-50 p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
                        ))}
                        {Array.from({ length: 31 }).map((_, i) => (
                          <div key={i} className="bg-white min-h-[120px] p-3 hover:bg-slate-50 transition-colors cursor-pointer group">
                            <span className="text-sm font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{i + 1}</span>
                            <div className="mt-2 space-y-1">
                              {calendarEvents.filter(e => new Date(e.start).getDate() === i + 1).map(event => (
                                <div key={event.id} className={cn(
                                  "px-2 py-1 rounded text-[9px] font-bold truncate",
                                  event.type === 'booking' ? "bg-indigo-50 text-indigo-600" : 
                                  event.type === 'staff_schedule' ? "bg-amber-50 text-amber-600" : 
                                  "bg-emerald-50 text-emerald-600"
                                )}>
                                  {event.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900 mb-4">Upcoming Reminders</h3>
                      <div className="space-y-4">
                        {[
                          { title: 'Visa Deadline: John Doe', time: 'In 2 hours', type: 'alert' },
                          { title: 'Staff Meeting', time: 'Tomorrow, 10:00 AM', type: 'info' },
                          { title: 'Payment Due: Santorini Trip', time: 'In 3 days', type: 'payment' }
                        ].map((rem, idx) => (
                          <div key={idx} className="flex gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                              rem.type === 'alert' ? "bg-rose-100 text-rose-600" : 
                              rem.type === 'payment' ? "bg-amber-100 text-amber-600" : 
                              "bg-indigo-100 text-indigo-600"
                            )}>
                              <Clock4 size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{rem.title}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{rem.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-lg shadow-indigo-100">
                      <h3 className="text-lg font-black mb-2">Sync with Google</h3>
                      <p className="text-indigo-100 text-xs leading-relaxed mb-6">
                        Automatically sync your Fiezta calendar with Google Calendar for real-time updates across all devices.
                      </p>
                      <button className="w-full py-3 bg-white text-indigo-600 rounded-2xl text-sm font-bold hover:bg-indigo-50 transition-all">
                        Connect Google Calendar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Profile Settings</h3>
                  <div className="flex items-center gap-6 mb-8">
                    <img 
                      src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
                      className="w-24 h-24 rounded-[24px] border-4 border-slate-50 shadow-sm" 
                      alt="Profile" 
                    />
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">{profile?.displayName}</h4>
                      <p className="text-slate-500">{profile?.email}</p>
                      <span className="mt-2 inline-block px-3 py-1 bg-amber-50 text-[#D4AF37] text-[10px] font-bold rounded-full uppercase tracking-widest border border-amber-100">
                        {profile?.role} Account
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contact Information</h4>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Phone Number</label>
                        <input 
                          type="tel" 
                          defaultValue={profile?.phoneNumber}
                          onBlur={(e) => updateProfile({ phoneNumber: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Address</label>
                        <textarea 
                          defaultValue={profile?.address}
                          onBlur={(e) => updateProfile({ address: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all resize-none"
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Emergency Contact</h4>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Name</label>
                        <input 
                          type="text" 
                          defaultValue={profile?.emergencyContact?.name}
                          onBlur={(e) => updateProfile({ emergencyContact: { ...profile?.emergencyContact, name: e.target.value } })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Phone</label>
                        <input 
                          type="tel" 
                          defaultValue={profile?.emergencyContact?.phone}
                          onBlur={(e) => updateProfile({ emergencyContact: { ...profile?.emergencyContact, phone: e.target.value } })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Travel Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Preferred Destinations</label>
                      <div className="flex flex-wrap gap-2">
                        {['Dubai', 'USA', 'UK', 'Canada', 'Italy', 'France', 'Maldives', 'Singapore'].map((dest) => (
                          <button
                            key={dest}
                            onClick={() => {
                              const current = profile?.preferences?.destinations || [];
                              const next = current.includes(dest) 
                                ? current.filter(d => d !== dest) 
                                : [...current, dest];
                              updateProfile({ preferences: { ...profile?.preferences, destinations: next } });
                            }}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                              profile?.preferences?.destinations?.includes(dest)
                                ? "bg-[#D4AF37] text-white border-[#D4AF37]"
                                : "bg-slate-50 text-slate-500 border-slate-100 hover:border-[#D4AF37]"
                            )}
                          >
                            {dest}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Budget Range</label>
                        <select 
                          value={profile?.preferences?.budget || ''}
                          onChange={(e) => updateProfile({ preferences: { ...profile?.preferences, budget: e.target.value as any } })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all"
                        >
                          <option value="">Select Budget</option>
                          <option value="Economy">Economy</option>
                          <option value="Standard">Standard</option>
                          <option value="Luxury">Luxury</option>
                          <option value="Ultra-Luxury">Ultra-Luxury</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Travel Type</label>
                        <select 
                          value={profile?.preferences?.travelType || ''}
                          onChange={(e) => updateProfile({ preferences: { ...profile?.preferences, travelType: e.target.value as any } })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all"
                        >
                          <option value="">Select Type</option>
                          <option value="Solo">Solo</option>
                          <option value="Family">Family</option>
                          <option value="Couple">Couple</option>
                          <option value="Group">Group</option>
                          <option value="Business">Business</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => auth.signOut()}
                    className="flex items-center gap-2 px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all border border-rose-100"
                  >
                    <LogOut size={20} />
                    Sign Out Account
                  </button>
                </div>

                {profile?.email === 'dbest4real2009@gmail.com' && profile?.role !== 'admin' && (
                  <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                    <div className="flex items-center gap-3 text-amber-700 mb-2">
                      <AlertCircle size={20} />
                      <h4 className="font-bold">Admin Access Detected</h4>
                    </div>
                    <p className="text-sm text-amber-600 mb-4">Your email is authorized for administrative access. Would you like to activate admin privileges for this account?</p>
                    <button 
                      onClick={async () => {
                        if (!profile) return;
                        await updateDoc(doc(db, 'users', profile.uid), { role: 'admin' });
                        setProfile({ ...profile, role: 'admin' });
                        alert("Admin privileges activated!");
                      }}
                      className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200"
                    >
                      Activate Admin Mode
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

        {/* Booking Wizard */}
        <AnimatePresence>
          {isBookingModalOpen && selectedPackage && profile && (
            <BookingWizard 
              pkg={selectedPackage}
              user={profile}
              onClose={() => setIsBookingModalOpen(false)}
              onSuccess={onBookingSuccess}
            />
          )}

          <BookingDetailModal />
        </AnimatePresence>
    </div>
  );
}
