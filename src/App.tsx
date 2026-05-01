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
  Role,
  Theme,
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
  Coupon,
  Menu
} from './types';
import { cn, formatCurrency } from './lib/utils';
import { handleFirestoreError, OperationType } from './lib/error-handler';
import { encryptData, decryptData, logActivity } from './lib/security';
import { exportToCSV, exportToPDF } from './lib/export';
import { SocialDashboard } from './components/SocialDashboard';
import { RoleManager } from './components/RoleManager';
import { GenericCRUD } from './components/GenericCRUD';
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
  Menu as MenuIcon,
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
  Shield,
  PieChart,
  Home,
  MapPin,
  Clock3,
  DollarSign,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Activity,
  Music,
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
  Layers,
  Play,
  Database,
  Palette,
  Handshake,
  Lightbulb,
  Video
} from 'lucide-react';
import { BlockRenderer } from './components/BlockRenderer';
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
import { VlogManagement } from './components/VlogManagement';
import { ThemeManager } from './components/ThemeManager';
import { AIItineraryBuilder } from './components/AIItineraryBuilder';
import { InteractiveMap } from './components/InteractiveMap';

// --- Components ---

const taskFields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'status', label: 'Status', type: 'select', options: ['todo', 'in_progress', 'done'] },
  { name: 'dueDate', label: 'Due Date', type: 'date' },
];

const packageFields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'destination', label: 'Destination', type: 'text', required: true },
  { name: 'price', label: 'Price', type: 'number', required: true },
  { name: 'duration', label: 'Duration', type: 'text' },
  { name: 'imageUrl', label: 'Image URL', type: 'text' },
  { name: 'status', label: 'Status', type: 'select', options: ['active', 'draft', 'archived'] },
];

const pageFields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'text', required: true },
  { name: 'content', label: 'Content (HTML)', type: 'html' },
  { name: 'status', label: 'Status', type: 'select', options: ['publish', 'draft'] },
  { name: 'blocks', label: 'Blocks (Builder)', type: 'page-builder' },
];

const menuFields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'location', label: 'Location', type: 'select', options: ['header', 'footer', 'sidebar'] },
  { name: 'items', label: 'Menu Items (JSON)', type: 'json', defaultValue: [] },
  { name: 'isActive', label: 'Is Active', type: 'boolean', defaultValue: true },
];

const postFields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'excerpt', label: 'Excerpt', type: 'textarea' },
  { name: 'content', label: 'Content (HTML)', type: 'html' },
  { name: 'status', label: 'Status', type: 'select', options: ['publish', 'draft'] },
  { name: 'featuredImage', label: 'Featured Image', type: 'text' },
];

const serviceFields = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'description', label: 'Description (HTML)', type: 'html' },
  { name: 'price', label: 'Price', type: 'number', required: true },
  { name: 'category', label: 'Category', type: 'select', options: ['entertainment', 'travel', 'rental', 'tour', 'other'] },
  { name: 'imageUrl', label: 'Image URL', type: 'text' },
  { name: 'isActive', label: 'Is Active', type: 'boolean', defaultValue: true },
];

const inventionFields = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'description', label: 'Short Description', type: 'textarea' },
  { name: 'content', label: 'Full Content (HTML)', type: 'html' },
  { name: 'features', label: 'Features (JSON Array)', type: 'json' },
  { name: 'imageUrl', label: 'Image URL', type: 'text' },
  { name: 'status', label: 'Status', type: 'select', options: ['active', 'draft'] },
];

const reviewFields = [
  { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
  { name: 'content', label: 'Content', type: 'textarea', required: true },
  { name: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
  { name: 'photoUrl', label: 'Photo URL', type: 'text' },
  { name: 'date', label: 'Date', type: 'date' },
];

const faqFields = [
  { name: 'question', label: 'Question', type: 'text', required: true },
  { name: 'answer', label: 'Answer', type: 'textarea', required: true },
  { name: 'order', label: 'Order', type: 'number' },
];

const invoiceFields = [
  { name: 'bookingId', label: 'Booking ID', type: 'text' },
  { name: 'clientId', label: 'Client ID', type: 'text' },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'dueDate', label: 'Date', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'paid', 'overdue'] },
];

const clientFields = [
  { name: 'displayName', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'text', required: true },
  { name: 'phoneNumber', label: 'Phone', type: 'text' },
  { name: 'address', label: 'Address', type: 'textarea' },
];

const staffFields = [
  { name: 'displayName', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'text', required: true },
  { name: 'role', label: 'Role', type: 'select', options: ['agent', 'accountant', 'support', 'admin'] },
  { name: 'phoneNumber', label: 'Phone', type: 'text' },
  { name: 'salary', label: 'Salary', type: 'number' },
  { name: 'employmentDate', label: 'Employment Date', type: 'date' },
  { name: 'employmentRecord', label: 'Employment Record (HTML)', type: 'html' },
  { name: 'queries', label: 'Queries/Warnings (HTML)', type: 'html' },
  { name: 'promotions', label: 'Promotions (HTML)', type: 'html' },
  { name: 'status', label: 'Status', type: 'select', options: ['active', 'dismissed', 'on_leave'] },
  { name: 'dismissalReason', label: 'Dismissal Reason', type: 'textarea' },
];

const siteSettingsFields = [
  { name: 'siteName', label: 'Site Name', type: 'text', required: true },
  { name: 'siteDescription', label: 'Site Description (HTML)', type: 'html' },
  { name: 'logoUrl', label: 'Logo', type: 'image' },
  { name: 'faviconUrl', label: 'Favicon', type: 'image' },
  { name: 'contactEmail', label: 'Contact Email', type: 'text' },
  { name: 'contactPhone', label: 'Contact Phone', type: 'text' },
  { name: 'address', label: 'Address (HTML)', type: 'html' },
  { name: 'facebook', label: 'Facebook URL', type: 'text' },
  { name: 'instagram', label: 'Instagram URL', type: 'text' },
  { name: 'twitter', label: 'Twitter URL', type: 'text' },
  { name: 'linkedin', label: 'LinkedIn URL', type: 'text' },
  { name: 'youtube', label: 'YouTube URL', type: 'text' },
];

const customFormFields = [
  { name: 'title', label: 'Form Title', type: 'text', required: true },
  { name: 'fields', label: 'Form Content (HTML)', type: 'html' },
  { name: 'submitUrl', label: 'Submit URL', type: 'text' },
];

const popupCampaignFields = [
  { name: 'title', label: 'Campaign Title', type: 'text', required: true },
  { name: 'type', label: 'Type', type: 'select', options: ['discount', 'offer', 'lead_capture'] },
  { name: 'content', label: 'Content (HTML)', type: 'html' },
  { name: 'trigger', label: 'Trigger', type: 'select', options: ['exit_intent', 'time_delay', 'scroll_depth'] },
  { name: 'isActive', label: 'Is Active', type: 'boolean', defaultValue: true },
];

const FieztaLogo = ({ className }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center rounded-full overflow-hidden", className)}>
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Outer black ring */}
      <circle cx="50" cy="50" r="48" fill="black" />
      
      {/* Inner orange circle */}
      <circle cx="50" cy="50" r="38" fill="#FF9900" />
      
      {/* Saxophone Player Silhouette (Approximate) */}
      <path 
        d="M50 25 c-5 0 -8 5 -8 10 s3 15 5 20 l-5 15 c0 2 2 4 4 4 s4 -2 4 -4 l3 -10 l5 10 c0 2 2 4 4 4 s4 -2 4 -4 l-5 -15 c2 -5 5 -15 5 -20 s-3 -10 -8 -10 Z" 
        fill="black" 
      />
      
      {/* Wheels */}
      <circle cx="40" cy="80" r="6" fill="black" />
      <circle cx="40" cy="80" r="3" fill="#333" />
      <circle cx="60" cy="80" r="6" fill="black" />
      <circle cx="60" cy="80" r="3" fill="#333" />
      
      {/* Text Path for "FIEZTA INTERNATIONAL" */}
      <defs>
        <path id="circlePath" d="M 50, 50 m -45, 0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0" />
      </defs>
      <text fill="white" fontSize="4.5" fontWeight="black" letterSpacing="1">
        <textPath xlinkHref="#circlePath" startOffset="50%" textAnchor="middle">
          FIEZTA INTERNATIONAL
        </textPath>
      </text>
    </svg>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200",
      active 
        ? "bg-primary text-white shadow-lg shadow-primary/20" 
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

const ReviewCard = ({ review }: { review: any }) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Sparkles key={i} size={16} className={cn(i < review.rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-slate-200")} />
      ))}
    </div>
    <p className="text-slate-600 italic mb-6 leading-relaxed">"{review.content}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
        {review.photoUrl ? <img src={review.photoUrl} alt={review.customerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <UserIcon size={20} className="text-slate-400" />}
      </div>
      <div>
        <h5 className="font-bold text-slate-900 text-sm">{review.customerName}</h5>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{review.date ? new Date(review.date).toLocaleDateString() : 'Verified Customer'}</p>
      </div>
    </div>
  </div>
);

const FaqItem = ({ faq, isOpen, onToggle }: { faq: any, isOpen: boolean, onToggle: () => void }) => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4 transition-all">
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
    >
      <span className="font-bold text-slate-900">{faq.question}</span>
      <ChevronRight size={20} className={cn("text-slate-400 transition-transform", isOpen && "rotate-90 text-[#D4AF37]")} />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-slate-50"
        >
          <div className="p-6 text-slate-600 leading-relaxed">
            {faq.answer}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [currentPublicPage, setCurrentPublicPage] = useState<string>('home');
  const [activePageBlocks, setActivePageBlocks] = useState<any[]>([]);

  // Fetch Site Settings
  useEffect(() => {
    if (!agencyId) return;
    const q = query(collection(db, 'site_settings'), where('agencyId', '==', agencyId), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const settings = snapshot.docs[0].data();
        setSiteSettings(settings);
        
        // Update favicon dynamically
        if (settings.faviconUrl) {
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = settings.faviconUrl;
        }
        
        // Update Title
        if (settings.siteName) {
          document.title = settings.siteName;
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'site_settings'));
    return () => unsubscribe();
  }, [agencyId]);

  // Fetch Active Theme
  useEffect(() => {
    if (!agencyId) return;
    const themeQuery = query(
      collection(db, 'themes'), 
      where('agencyId', '==', agencyId), 
      where('isActive', '==', true),
      limit(1)
    );
    const unsubscribe = onSnapshot(themeQuery, (snapshot) => {
      if (!snapshot.empty) {
        const themeData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Theme;
        setActiveTheme(themeData);
        applyTheme(themeData);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'themes'));
    return () => unsubscribe();
  }, [agencyId]);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const config = theme.config;
    root.style.setProperty('--primary', config.primaryColor);
    root.style.setProperty('--secondary', config.secondaryColor);
    root.style.setProperty('--accent', config.accentColor);
    root.style.setProperty('--background', config.backgroundColor);
    root.style.setProperty('--foreground', config.textColor);
    root.style.setProperty('--radius', config.borderRadius);
    root.style.fontFamily = config.fontFamily;
  };
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [transport, setTransport] = useState<Transport[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);

  useEffect(() => {
    if (currentPublicPage === 'home' || currentPublicPage === 'inventions') {
      setActivePageBlocks([]);
      return;
    }
    const page = pages.find(p => p.slug === currentPublicPage);
    if (page) {
      setActivePageBlocks(page.blocks || []);
    }
  }, [currentPublicPage, pages]);

  const [inventions, setInventions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isItineraryBuilderOpen, setIsItineraryBuilderOpen] = useState(false);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  
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
  const [chatMessages, setChatMessages] = useState<{ id: string, role: 'user' | 'ai', text: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Booking Modal State
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);
  const [selectedCrudEntity, setSelectedCrudEntity] = useState<any>(null);
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
            // Bootstrap super admin role if email matches
            if (firebaseUser.email === 'dbest4real2009@gmail.com' && userData.role !== 'super_admin') {
              const updatedProfile = { ...userData, role: 'super_admin' as UserRole };
              await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'super_admin' });
              setProfile(updatedProfile);
              setAgencyId(userData.agencyId);
            } else {
              setProfile(userData);
              setAgencyId(userData.agencyId);
            }
          } else {
            const defaultAgencyId = 'agency_001'; // Default for new users in this demo
            const isSuperAdmin = firebaseUser.email === 'dbest4real2009@gmail.com';
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              agencyId: defaultAgencyId,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: isSuperAdmin ? 'super_admin' : 'client',
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
        setAgencyId(null);
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
    }, (error) => handleFirestoreError(error, OperationType.GET, 'packages'));

    // Fetch Bookings
    let bookingsQuery;
    if (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'agent') {
      bookingsQuery = query(collection(db, 'bookings'), where('agencyId', '==', agencyId), orderBy('createdAt', 'desc'));
    } else {
      bookingsQuery = query(collection(db, 'bookings'), where('agencyId', '==', agencyId), where('clientId', '==', profile.uid), orderBy('createdAt', 'desc'));
    }
    
    const bookingsUnsub = onSnapshot(bookingsQuery, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'bookings'));

    // Fetch Accommodations
    const accUnsub = onSnapshot(query(collection(db, 'accommodations'), where('agencyId', '==', agencyId)), (snapshot) => {
      setAccommodations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Accommodation)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'accommodations'));

    // Fetch Transports
    const transUnsub = onSnapshot(query(collection(db, 'transport'), where('agencyId', '==', agencyId)), (snapshot) => {
      setTransport(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transport)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'transport'));

    // Fetch Invoices
    const invQuery = (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'accountant') 
      ? query(collection(db, 'invoices'), where('agencyId', '==', agencyId)) 
      : query(collection(db, 'invoices'), where('agencyId', '==', agencyId), where('clientId', '==', profile.uid));
    const invUnsub = onSnapshot(invQuery, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'invoices'));

    // Fetch Documents
    const docQuery = (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'agent') 
      ? query(collection(db, 'documents'), where('agencyId', '==', agencyId)) 
      : query(collection(db, 'documents'), where('agencyId', '==', agencyId), where('clientId', '==', profile.uid));
    const docUnsub = onSnapshot(docQuery, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TravelDocument)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'documents'));

    // Fetch Tasks
    const taskUnsub = onSnapshot(query(collection(db, 'tasks'), where('agencyId', '==', agencyId)), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

    // Fetch Staff
    let staffUnsub = () => {};
    if (profile.role === 'super_admin' || profile.role === 'admin') {
      staffUnsub = onSnapshot(query(collection(db, 'users'), where('agencyId', '==', agencyId), where('role', '!=', 'client')), (snapshot) => {
        setStaff(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'users/staff'));
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
    }, (error) => handleFirestoreError(error, OperationType.GET, 'messages'));

    // Fetch Audit Logs
    let logsUnsub = () => {};
    if (profile.role === 'super_admin' || profile.role === 'admin') {
      logsUnsub = onSnapshot(query(collection(db, 'audit_logs'), where('agencyId', '==', agencyId), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
        setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'audit_logs'));
    }

    // Fetch Subscribers
    let subUnsub = () => {};
    if (profile.role === 'super_admin' || profile.role === 'admin') {
      subUnsub = onSnapshot(query(collection(db, 'subscribers'), where('agencyId', '==', agencyId)), (snapshot) => {
        setSubscribers(snapshot.docs.map(doc => ({ id: doc.id, email: doc.id, ...doc.data() } as NewsletterSubscriber)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'subscribers'));
    }

    // Fetch Clients
    let clientsUnsub = () => {};
    if (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'agent') {
      clientsUnsub = onSnapshot(query(collection(db, 'users'), where('agencyId', '==', agencyId), where('role', '==', 'client')), (snapshot) => {
        setClients(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'users/clients'));
    }

    // Fetch WP Posts
    const wpPostsUnsub = onSnapshot(query(collection(db, 'wp_posts'), where('agencyId', '==', agencyId)), (snapshot) => {
      setWpPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'wp_posts'));

    // Fetch Menus
    const menusUnsub = onSnapshot(query(collection(db, 'menus'), where('agencyId', '==', agencyId), where('isActive', '==', true)), (snapshot) => {
      setMenus(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Menu[]);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'menus'));

    // Fetch Roles
    const rolesUnsub = onSnapshot(query(collection(db, 'roles'), where('agencyId', '==', agencyId)), (snapshot) => {
      setAvailableRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Role[]);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'roles'));

    // Fetch Services
    const servicesUnsub = onSnapshot(query(collection(db, 'services'), where('agencyId', '==', agencyId)), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'services'));

    // Fetch Reviews
    const reviewsUnsub = onSnapshot(query(collection(db, 'reviews'), where('agencyId', '==', agencyId)), (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reviews'));

    // Fetch FAQs
    const faqsUnsub = onSnapshot(query(collection(db, 'faqs'), where('agencyId', '==', agencyId), orderBy('order', 'asc')), (snapshot) => {
      setFaqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'faqs'));

    // Fetch Pages
    const pagesUnsub = onSnapshot(query(collection(db, 'pages'), where('agencyId', '==', agencyId)), (snapshot) => {
      setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'pages'));

    // Fetch Inventions
    const inventionsUnsub = onSnapshot(query(collection(db, 'inventions'), where('agencyId', '==', agencyId)), (snapshot) => {
      setInventions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'inventions'));

    // Fetch Custom Forms
    const formsUnsub = onSnapshot(query(collection(db, 'custom_forms'), where('agencyId', '==', agencyId)), (snapshot) => {
      setCustomForms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomForm)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'custom_forms'));

    // Fetch Popup Campaigns
    const popupsUnsub = onSnapshot(query(collection(db, 'popup_campaigns'), where('agencyId', '==', agencyId)), (snapshot) => {
      setPopupCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PopupCampaign)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'popup_campaigns'));

    // Fetch Calendar Events
    const calendarUnsub = onSnapshot(query(collection(db, 'calendar_events'), where('agencyId', '==', agencyId)), (snapshot) => {
      setCalendarEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'calendar_events'));

    // Fetch Social Posts
    const socialUnsub = onSnapshot(query(collection(db, 'social_posts'), where('agencyId', '==', agencyId), orderBy('scheduledAt', 'desc')), (snapshot) => {
      setSocialPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialPost)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'social_posts'));

    // Fetch Coupons
    const couponsUnsub = onSnapshot(query(collection(db, 'coupons'), where('agencyId', '==', agencyId)), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'coupons'));

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
      menusUnsub();
      rolesUnsub();
      servicesUnsub();
      reviewsUnsub();
      faqsUnsub();
      pagesUnsub();
      inventionsUnsub();
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

    const userMsgId = Math.random().toString(36).substring(2, 15);
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', text: userMsg }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const aiResponse = await getTravelAdvice(userMsg);
      const aiMsgId = Math.random().toString(36).substring(2, 15);
      setChatMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: aiResponse || 'Sorry, I couldn\'t help with that.' }]);
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
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      const seedData = async () => {
        // Seed Menus
        if (menus.length === 0) {
          const initialMenus = [
            {
              agencyId: profile.agencyId,
              title: 'Main Header',
              location: 'header',
              isActive: true,
              items: [
                { label: 'Destinations', url: '#destinations', order: 1 },
                { label: 'Travel', url: '/travel', order: 2 },
                { label: 'Entertainment', url: '/entertainment', order: 3 },
                { label: 'Rentals', url: '/rentals', order: 4 },
                { label: 'Vlog', url: '/vlog', order: 5 },
                { label: 'Inventions', url: '/inventions', order: 6 },
                { label: 'Contact', url: '#contact', order: 7 }
              ],
              createdAt: new Date().toISOString()
            },
            {
              agencyId: profile.agencyId,
              title: 'Company Footer',
              location: 'footer-company',
              isActive: true,
              items: [
                { label: 'About Us', url: '#', order: 1 },
                { label: 'Careers', url: '#', order: 2 },
                { label: 'Privacy Policy', url: '#', order: 3 }
              ],
              createdAt: new Date().toISOString()
            },
            {
              agencyId: profile.agencyId,
              title: 'Support Footer',
              location: 'footer-support',
              isActive: true,
              items: [
                { label: 'Help Center', url: '#', order: 1 },
                { label: 'Contact Us', url: '#', order: 2 },
                { label: 'Status', url: '#', order: 3 }
              ],
              createdAt: new Date().toISOString()
            }
          ];
          for (const menu of initialMenus) {
            await addDoc(collection(db, 'menus'), menu);
          }
        }

        // Seed WP Posts
        if (wpPosts.length === 0) {
          const posts = [
            { agencyId: profile.agencyId, title: 'Top 10 Destinations for 2026', excerpt: 'Discover the most breathtaking places to visit this year...', date: new Date().toISOString(), status: 'publish', link: '#' },
            { agencyId: profile.agencyId, title: 'How to Plan Your Dream Wedding Abroad', excerpt: 'Everything you need to know about destination weddings...', date: new Date().toISOString(), status: 'publish', link: '#' }
          ];
          for (const post of posts) {
            await addDoc(collection(db, 'wp_posts'), post);
          }
        }

        // Seed Custom Forms
        if (customForms.length === 0) {
          await addDoc(collection(db, 'custom_forms'), {
            agencyId: profile.agencyId,
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
            agencyId: profile.agencyId,
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
            { agencyId: profile.agencyId, title: 'Santorini Group Trip', start: new Date(2026, 2, 28).toISOString(), end: new Date(2026, 3, 5).toISOString(), type: 'booking', description: 'Group of 12' },
            { agencyId: profile.agencyId, title: 'Staff Training', start: new Date(2026, 2, 27, 10, 0).toISOString(), end: new Date(2026, 2, 27, 12, 0).toISOString(), type: 'staff_schedule', description: 'New CMS features' }
          ];
          for (const event of events) {
            await addDoc(collection(db, 'calendar_events'), event);
          }
        }
        // Seed Services
        if (services.length === 0) {
          const initialServices = [
            { agencyId: profile.agencyId, name: 'Live Entertainment Bands', description: 'World-class musical entertainment for your luxury events and parties.', category: 'entertainment', price: 1500, isActive: true },
            { agencyId: profile.agencyId, name: 'Musical Instruments Rental', description: 'High-quality saxophones, pianos, and sound equipment for rent.', category: 'rental', price: 200, isActive: true },
            { agencyId: profile.agencyId, name: 'DMV Area Concierge', description: 'Elite accommodation research and arrangement within DC, Maryland, and Virginia.', category: 'tour', price: 500, isActive: true },
            { agencyId: profile.agencyId, name: 'Seamless Travel Services', description: 'Airport pick-ups, visa processing, and sightseeing tour planning.', category: 'travel', price: 300, isActive: true }
          ];
          for (const service of initialServices) {
            await addDoc(collection(db, 'services'), service);
          }
        }

        // Seed Reviews
        if (reviews.length === 0) {
          const initialReviews = [
            { agencyId: profile.agencyId, customerName: 'Adebola S.', content: 'The concierge services provided by this company are top-notch! From visa processing to airport pickups, everything was seamless and well-coordinated.', rating: 5, date: new Date().toISOString() },
            { agencyId: profile.agencyId, customerName: 'Elena V.', content: 'Amazing tourist guide services! They made my trip unforgettable by showing me the best spots and hidden gems in the city.', rating: 5, date: new Date().toISOString() },
            { agencyId: profile.agencyId, customerName: 'Marcus J.', content: 'I rented sound equipment for a corporate event, and it was a great decision. Pristine condition and outstanding support.', rating: 5, date: new Date().toISOString() }
          ];
          for (const review of initialReviews) {
            await addDoc(collection(db, 'reviews'), review);
          }
        }

        // Seed FAQs
        if (faqs.length === 0) {
          const initialFaqs = [
            { agencyId: profile.agencyId, question: 'What areas do you cover?', answer: 'We primarily cover the DMV area (Washington DC, Maryland, Virginia) for lifestyle concierge but offer global travel support.', order: 1 },
            { agencyId: profile.agencyId, question: 'How do I book a band?', answer: 'You can book through our services portal or contact our concierge directly for a bespoke quote.', order: 2 },
            { agencyId: profile.agencyId, question: 'Do you offer airport pickups?', answer: 'Yes, we offer seamless airport pickups on the day of arrival as part of our travel services.', order: 3 }
          ];
          for (const faq of initialFaqs) {
            await addDoc(collection(db, 'faqs'), faq);
          }
        }

        // Seed Pages
        if (pages.length === 0) {
          const initialPages = [
            {
              agencyId: profile.agencyId,
              title: 'Exclusive Travel',
              slug: 'travel',
              status: 'publish',
              blocks: [
                { id: '1', type: 'hero', data: { title: 'Seamless Travel', description: 'Elite accommodation research and arrangement within DC, Maryland, and Virginia.', tagline: 'LUXURY CONCIERGE', buttonLabel: 'Explore Packages' } },
                { id: '2', type: 'grid', data: { title: 'Travel Services', subtitle: 'Global support for discerning travelers.', columns: 3, items: [
                  { title: 'Airport Pick-ups', description: 'Seamless transitions from the moment you land.' },
                  { title: 'Visa Processing', description: 'Handling the paperwork while you plan the fun.' },
                  { title: 'Sightseeing', description: 'Curated tours of the DMV area and beyond.' }
                ] } },
                { id: '3', type: 'cta', data: { title: 'Ready to Fly?', description: 'Contact our travel concierge today.', buttonLabel: 'Contact Us', buttonAction: '#contact' } }
              ]
            },
            {
              agencyId: profile.agencyId,
              title: 'Elite Entertainment',
              slug: 'entertainment',
              status: 'publish',
              blocks: [
                { id: '1', type: 'hero', data: { title: 'Elite Entertainment', description: 'World-class musical entertainment for your luxury events and parties.', tagline: 'LIVE MUSIC', buttonLabel: 'Book a Band' } },
                { id: '2', type: 'video', data: { title: 'Performance Highlights', duration: '3:45', thumbnail: 'https://images.unsplash.com/photo-1514525253361-bee047320bca?auto=format&fit=crop&q=80' } },
                { id: '3', type: 'grid', data: { title: 'Our Talent', subtitle: 'A roster of world-class performers.', columns: 3, items: [
                  { title: 'Jazz Bands', description: 'Sophisticated sounds for your corporate mixer.' },
                  { title: 'DJs & Producers', description: 'High-energy beats for exclusive celebrations.' },
                  { title: 'Soloists', description: 'Elegant string or piano accompaniment.' }
                ] } }
              ]
            },
            {
              agencyId: profile.agencyId,
              title: 'Luxury Rentals',
              slug: 'rentals',
              status: 'publish',
              blocks: [
                { id: '1', type: 'hero', data: { title: 'Pristine Rentals', description: 'High-quality saxophones, pianos, and sound equipment for rent.', tagline: 'EQUIPMENT & MORE', buttonLabel: 'View Catalog' } },
                { id: '2', type: 'grid', data: { title: 'Rental Category', subtitle: 'Everything you need for the perfect sound.', columns: 4, items: [
                  { title: 'Saxophones', description: 'Professional grade instruments.' },
                  { title: 'Grand Pianos', description: 'Stunning centerpieces for any room.' },
                  { title: 'Sound Systems', description: 'Crystal clear audio for ceremonies.' },
                  { title: 'Luxury Transport', description: 'Travel in style across the DMV.' }
                ] } }
              ]
            },
            {
              agencyId: profile.agencyId,
              title: 'Fiezta Vlog',
              slug: 'vlog',
              status: 'publish',
              blocks: [
                { id: '1', type: 'hero', data: { title: 'Lifestyle Vlog', description: 'Behind the scenes of our most exclusive DMV events.', tagline: 'FIEZTA LIFE', buttonLabel: 'Watch Now' } },
                { id: '2', type: 'video', data: { title: 'The Great Escape 2026', duration: '12:00' } },
                { id: '3', type: 'grid', data: { title: 'Recent Stories', columns: 3, items: [
                  { title: 'DC Jazz Night', description: 'A night to remember at the Mayflower.' },
                  { title: 'Maryland Wedding', description: 'Waterfront elegance and soul.' },
                  { title: 'Virginia Vineyard', description: 'A musical tour of VA wine country.' }
                ] } }
              ]
            }
          ];
          for (const page of initialPages) {
            await addDoc(collection(db, 'pages'), page);
          }
        }
      };
      seedData();
    }
  }, [profile, wpPosts.length, customForms.length, popupCampaigns.length, calendarEvents.length, menus.length, services.length, reviews.length, faqs.length, pages.length]);

  const onBookingSuccess = () => {
    setIsBookingModalOpen(false);
    setSelectedPackage(null);
    setActiveTab('bookings');
  };

  const handleCreatePackage = async () => {
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return;
    
    const samplePackages = [
      {
        agencyId: profile.agencyId,
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
        agencyId: profile.agencyId,
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
        agencyId: profile.agencyId,
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
      { agencyId: profile.agencyId, name: "Burj Al Arab", type: "hotel", location: "Dubai", pricePerNight: 1500, amenities: ["Spa", "Private Beach", "Butler Service"], availability: true },
      { agencyId: profile.agencyId, name: "Villa d'Este", type: "villa", location: "Lake Como, Italy", pricePerNight: 2000, amenities: ["Pool", "Garden", "Lake View"], availability: true },
      { agencyId: profile.agencyId, name: "Hôtel Plaza Athénée", type: "hotel", location: "Paris", pricePerNight: 1200, amenities: ["Fine Dining", "Spa", "City View"], availability: true }
    ];

    const sampleTransports = [
      { agencyId: profile.agencyId, type: "car", model: "Rolls Royce Phantom", capacity: 4, pricePerDay: 800, availability: true },
      { agencyId: profile.agencyId, type: "private_jet", model: "Gulfstream G650", capacity: 14, pricePerDay: 15000, availability: true },
      { agencyId: profile.agencyId, type: "shuttle", model: "Mercedes V-Class", capacity: 7, pricePerDay: 300, availability: true }
    ];

    try {
      for (const pkg of samplePackages) {
        await addDoc(collection(db, 'packages'), pkg);
      }
      for (const acc of sampleAccommodations) {
        await addDoc(collection(db, 'accommodations'), acc);
      }
      for (const trans of sampleTransports) {
        await addDoc(collection(db, 'transport'), trans);
      }
      
      // Seed some tasks for admin
      const sampleTasks = [
        { agencyId: profile.agencyId, title: "Review new booking requests", assignedTo: profile.uid, status: "todo", priority: "high", dueDate: new Date().toISOString(), createdAt: new Date().toISOString() },
        { agencyId: profile.agencyId, title: "Update Dubai package pricing", assignedTo: profile.uid, status: "in_progress", priority: "medium", dueDate: new Date().toISOString(), createdAt: new Date().toISOString() }
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
    if (currentPublicPage === 'inventions') {
      return (
        <div className="min-h-screen bg-white font-sans">
          {/* Header */}
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
             <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
               <button onClick={() => setCurrentPublicPage('home')} className="flex items-center gap-3 group">
                 <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                   <FieztaLogo className="w-full h-full" />
                 </div>
                 <div className="flex flex-col text-left">
                   <span className="font-black text-xl tracking-tighter uppercase group-hover:text-[#D4AF37] transition-colors leading-none">Fiezta</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">International</span>
                 </div>
               </button>
               <div className="flex items-center gap-4">
                 <button onClick={() => setCurrentPublicPage('home')} className="hidden sm:block text-sm font-bold text-slate-600 hover:text-[#D4AF37] transition-colors">
                   Back to Home
                 </button>
                 <button onClick={handleLogin} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-[#D4AF37] transition-all">
                   Sign In
                 </button>
               </div>
             </div>
          </nav>

          <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
             <div className="mb-16">
               <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.4em] mb-4 block animate-pulse">Patented Project Seeking Licensing Agreement</span>
               <h1 className="text-5xl lg:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.95]">
                 Wireless Portable <span className="text-[#D4AF37]">Electronic</span> Charger
               </h1>
               <div className="flex flex-wrap gap-4 mb-8">
                 <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-all flex items-center gap-2">
                   <Mail size={18} /> Email Us
                 </button>
                 <button className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                   <Smartphone size={18} /> Call Us
                 </button>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
               <div className="space-y-8">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 mb-6">What is Wireless Energy?</h3>
                    <p className="text-xl text-slate-600 leading-relaxed">
                      Wireless Energy is a multipurpose charging device that can supply battery power to phones, tablets, and other electronics without the need for an electrical outlet. Users can connect their devices to the Wireless Energy Unit and have access to charging and Wi-Fi at any desired location.
                    </p>
                  </div>
                  <div className="p-8 bg-amber-50 rounded-[32px] border border-amber-100">
                    <p className="text-slate-700 leading-relaxed font-medium">
                      The wireless Portable Electronic Charger, which is a patent-based project would be an excellent extension to your existing product line. We believe your organization would benefit from this innovative device.
                    </p>
                  </div>
               </div>
               <div className="relative group">
                  <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-[40px] blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                  <div className="relative bg-slate-900 p-12 rounded-[40px] border border-white/10 shadow-2xl overflow-hidden">
                    <Zap size={120} className="text-[#D4AF37] mb-8 opacity-20 absolute -top-4 -right-4 rotate-12" />
                    <h4 className="text-2xl font-black text-white mb-4">Unique Market Benefits</h4>
                    <p className="text-slate-400 leading-relaxed mb-8">
                      This Project contains proprietary intellectual property rights established through the patent allowance. We are confident this Wireless Portable Electronic Charger would offer your company the benefits of having this unique product in the marketplace in addition to substantial profitability.
                    </p>
                    <div className="flex gap-2">
                      {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>)}
                    </div>
                  </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
                <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <Layout size={24} className="text-[#D4AF37]" />
                    Project Overview
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-[#D4AF37] text-white rounded-lg flex items-center justify-center shrink-0 mt-1"><CheckCircle2 size={14} /></div>
                      <p className="text-slate-600 font-medium">Patent-based product: Wireless Portable Electronic Charger.</p>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-[#D4AF37] text-white rounded-lg flex items-center justify-center shrink-0 mt-1"><CheckCircle2 size={14} /></div>
                      <p className="text-slate-600 font-medium">Proprietary intellectual property rights secured through patent allowance.</p>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-[#D4AF37] text-white rounded-lg flex items-center justify-center shrink-0 mt-1"><CheckCircle2 size={14} /></div>
                      <p className="text-slate-600 font-medium">Designed to complement and extend your current product line.</p>
                    </li>
                  </ul>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  <div className="p-10 bg-white border border-slate-100 rounded-[40px] flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0"><Target className="text-[#D4AF37]" size={32} /></div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">Key Benefits</h4>
                      <p className="text-sm text-slate-500">Unique product offering with significant market potential and substantial profitability.</p>
                    </div>
                  </div>
                  <div className="p-10 bg-white border border-slate-100 rounded-[40px] flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0"><TrendingUp className="text-indigo-600" size={32} /></div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">Prospectus Overview</h4>
                      <p className="text-sm text-slate-500">Detailed product overview, market analysis, and financial forecasts available.</p>
                    </div>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
                {[
                  { icon: Zap, title: 'Wireless Charging', desc: 'Wireless charging and Wi-Fi system designed to offer power and internet at home or traveling.' },
                  { icon: Layout, title: 'Software Management', desc: 'App that connects wirelessly with several devices to utilize charging or WiFi.' },
                  { icon: Shield, title: 'Battery Safety', desc: 'Prevents running out of battery or access to WiFi at important social events.' },
                  { icon: Globe, title: 'Portable', desc: 'Portable charger capable of supplying battery power and Wi-Fi to smartphones, tablets, etc.' }
                ].map((feature, i) => (
                  <div key={i} className="p-8 bg-white border border-slate-100 rounded-[32px] hover:border-[#D4AF37] transition-all">
                    <feature.icon className="text-[#D4AF37] mb-4" size={32} />
                    <h4 className="font-bold text-slate-900 mb-2">{feature.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
             </div>

             <div className="bg-slate-900 rounded-[48px] p-12 lg:p-20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-20 opacity-10">
                  <Handshake size={300} className="rotate-12" />
                </div>
                <div className="relative z-10 max-w-2xl text-center mx-auto">
                  <h2 className="text-4xl lg:text-6xl font-black mb-8">Partnership Opportunity</h2>
                  <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                    Seeking a long-term arrangement, potentially including exclusivity. Looking for a company to manufacture, distribute, and sell Wireless Portable Electronics Chargers.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-6">
                    <button className="px-10 py-5 bg-[#D4AF37] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                       Get Started Today <ChevronRight size={20} />
                    </button>
                    <button className="px-10 py-5 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
                       Contact Me
                    </button>
                  </div>
                </div>
             </div>
            </div>
          </div>
          <footer className="py-20 border-t border-slate-50 bg-slate-50/30">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <FieztaLogo className="w-12 h-12 mx-auto mb-6" />
              <p className="text-slate-400 text-sm">© 2026 Fiezta Inventions. All intellectual property rights reserved.</p>
            </div>
          </footer>
        </div>
      );
    }

    if (activePageBlocks.length > 0) {
      return (
        <div className="min-h-screen bg-white font-sans selection:bg-amber-100">
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
             <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
               <button onClick={() => setCurrentPublicPage('home')} className="flex items-center gap-3 group">
                 <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                   <FieztaLogo className="w-full h-full" />
                 </div>
                 <div className="flex flex-col text-left">
                   <span className="font-black text-xl tracking-tighter uppercase group-hover:text-[#D4AF37] transition-colors leading-none">Fiezta</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">International</span>
                 </div>
               </button>
               
               <div className="hidden md:flex items-center gap-8">
                 {menus.find(m => m.location === 'header')?.items.sort((a, b) => a.order - b.order).map(item => (
                   <button 
                     key={item.label} 
                     onClick={() => {
                        if (item.url === 'home' || item.url === '/') {
                          setCurrentPublicPage('home');
                        } else if (item.url.startsWith('/')) {
                          setCurrentPublicPage(item.url.substring(1));
                        } else if (item.url.startsWith('#')) {
                          setCurrentPublicPage('home');
                          setTimeout(() => {
                            const el = document.querySelector(item.url);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 300);
                        }
                     }}
                     className={cn(
                       "text-sm font-semibold transition-colors",
                       currentPublicPage === item.url.replace('/', '') ? "text-[#D4AF37]" : "text-slate-600 hover:text-[#D4AF37]"
                     )}
                   >
                     {item.label}
                   </button>
                 ))}
               </div>

               <div className="flex items-center gap-4">
                 <button onClick={handleLogin} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-[#D4AF37] transition-all">
                   Sign In
                 </button>
               </div>
             </div>
          </nav>

          <div className="pt-20">
            {activePageBlocks.map((block: any) => (
              <BlockRenderer 
                key={block.id} 
                block={block} 
                faqs={faqs} 
                reviews={reviews} 
                onAction={(action) => {
                  if (action === '#contact') {
                    setCurrentPublicPage('home');
                    setTimeout(() => {
                      const el = document.getElementById('contact');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                  }
                }}
              />
            ))}
          </div>

          <footer className="py-20 border-t border-slate-50 bg-slate-50/30">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <FieztaLogo className="w-12 h-12 mx-auto mb-6" />
              <p className="text-slate-400 text-sm">© 2026 Fiezta International. All rights reserved.</p>
            </div>
          </footer>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-white font-sans selection:bg-amber-100 selection:text-amber-900">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FieztaLogo className="w-10 h-10" />
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">FIEZTA</span>
                <span className="text-[10px] font-bold text-[#FF9900] uppercase tracking-widest mt-1">International</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              {menus.find(m => m.location === 'header')?.items.sort((a, b) => a.order - b.order).map(item => (
                <button 
                  key={item.label} 
                  onClick={() => {
                    if (item.url.startsWith('/')) {
                      setCurrentPublicPage(item.url.substring(1));
                    } else if (item.url.startsWith('#')) {
                      setCurrentPublicPage('home');
                      setTimeout(() => {
                        const el = document.querySelector(item.url);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 300);
                    }
                  }}
                  className="text-sm font-semibold text-slate-600 hover:text-[#D4AF37] transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <button 
                onClick={handleLogin}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-[#D4AF37] transition-all shadow-lg shadow-slate-200"
              >
                Sign In
              </button>
            </div>
            
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-slate-600 focus:outline-none"
            >
              {showMobileMenu ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>

          {/* Mobile Menu Panel */}
          {showMobileMenu && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4">
                {menus.find(m => m.location === 'header')?.items.sort((a, b) => a.order - b.order).map(item => (
                  <button 
                    key={item.label} 
                    onClick={() => {
                      if (item.url.startsWith('/')) {
                        setCurrentPublicPage(item.url.substring(1));
                      } else if (item.url.startsWith('#')) {
                        setCurrentPublicPage('home');
                        setTimeout(() => {
                          const el = document.querySelector(item.url);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 300);
                      }
                      setShowMobileMenu(false);
                    }}
                    className="text-left text-lg font-semibold text-slate-600 hover:text-[#D4AF37] transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <button 
                  onClick={() => {
                    handleLogin();
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl text-md font-bold hover:bg-[#D4AF37] transition-all shadow-lg"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          )}
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

        {/* Vlogs Section */}
        <section id="vlogs" className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-16">
              <div className="max-w-2xl">
                <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-6 uppercase">Travel <span className="text-[#D4AF37]">Vlogs</span></h2>
                <p className="text-xl text-slate-500">Experience the journey through our lens. Expert guides, hidden gems, and luxury tours.</p>
              </div>
              <button className="hidden md:flex items-center gap-2 text-[#D4AF37] font-bold group">
                View All Vlogs <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "Luxury Maldives Escape", duration: "12:45", views: "1.2k", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80" },
                { title: "Hidden Gems of Tokyo", duration: "15:20", views: "3.5k", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80" },
                { title: "Safari in Serengeti", duration: "22:10", views: "8.9k", img: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80" }
              ].map((vlog, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-video rounded-[32px] overflow-hidden mb-6 shadow-lg">
                    <img src={vlog.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={vlog.title} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                        <Play size={24} className="text-white fill-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white">
                      {vlog.duration}
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#D4AF37] transition-colors">{vlog.title}</h4>
                  <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                    <span className="flex items-center gap-1.5"><Eye size={14} /> {vlog.views} views</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> 2 days ago</span>
                  </div>
                </motion.div>
              ))}
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

        {/* Services Section */}
        <section id="services" className="py-32 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-6 uppercase">Our <span className="text-[#D4AF37]">Services</span></h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">Beyond convention, Fiezta is open. Elite concierge solutions for busy people and tourists.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  name: "Live Entertainment", 
                  desc: "World-class bands and soloists for your events.", 
                  icon: Music,
                  color: "bg-blue-50 text-blue-600 border-blue-100"
                },
                { 
                  name: "Seamless Travel", 
                  desc: "Visa processing, airport pickups, and local guides.", 
                  icon: Plane,
                  color: "bg-emerald-50 text-emerald-600 border-emerald-100"
                },
                { 
                  name: "Elite Rentals", 
                  desc: "Musical instruments, sound equipment, and luxury vehicles.", 
                  icon: Car,
                  color: "bg-amber-50 text-amber-600 border-amber-100"
                },
                { 
                  name: "DMV Concierge", 
                  desc: "Accommodation search and lifestyle management in the DMV area.", 
                  icon: Home,
                  color: "bg-rose-50 text-rose-600 border-rose-100"
                }
              ].map((service, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 bg-white border border-slate-100 rounded-[40px] hover:shadow-xl transition-all group"
                >
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border transition-transform group-hover:scale-110", service.color)}>
                    <service.icon size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-4">{service.name}</h4>
                  <p className="text-slate-500 leading-relaxed mb-6">{service.desc}</p>
                  <button onClick={handleLogin} className="text-[#D4AF37] font-bold flex items-center gap-2 group/btn">
                    Learn More <ChevronRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-32 bg-slate-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-6 uppercase">Voices of <span className="text-[#D4AF37]">Trust</span></h2>
                <p className="text-xl text-slate-500">What our royal customers say about the Fiezta experience.</p>
              </div>
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">
                  <X size={20} className="rotate-180" />
                </div>
                <div className="h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.length > 0 ? reviews.map((review, idx) => (
                <ReviewCard key={review.id} review={review} />
              )) : (
                [
                  { customerName: "Adebola S.", content: "The concierge services provided are top-notch! Everything was seamless.", rating: 5 },
                  { customerName: "Marcus J.", content: "Perfect luxury vehicle rental for our executive team. Professional and timely.", rating: 5 },
                  { customerName: "Elena V.", content: "Their sightseeing tour planning made our DC trip unforgettable.", rating: 5 }
                ].map((r, i) => <ReviewCard key={i} review={r} />)
              )}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-6 uppercase">FAQ</h2>
              <p className="text-xl text-slate-500">Everything you need to know about Fiezta concierge services.</p>
            </div>
            
            <div className="space-y-4">
              {faqs.length > 0 ? faqs.map((faq, idx) => (
                <FaqItem 
                  key={faq.id} 
                  faq={faq} 
                  isOpen={activeFaq === faq.id} 
                  onToggle={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)} 
                />
              )) : (
                [
                  { question: "What areas do you cover?", answer: "We primarily cover the DMV area (Washington DC, Maryland, Virginia) for accommodation and concierge, but our travel services are global." },
                  { question: "Can I book entertainment and travel together?", answer: "Yes! Fiezta is an all-in-one concierge. You can bundle entertainment, rentals, and travel services." },
                  { question: "How does the AI Itinerary work?", answer: "Our AI analyzes your preferences to create a custom 3-7 day plan including dining, sites, and logistics." }
                ].map((f, i) => (
                  <div key={i} className="bg-slate-50 p-6 rounded-2xl mb-4">
                    <h4 className="font-bold text-slate-900 mb-2">{f.question}</h4>
                    <p className="text-slate-600 text-sm">{f.answer}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Contact / Work With Us Section */}
        <section id="contact" className="py-32 bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent"></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-5xl lg:text-7xl font-black tracking-tighter text-white mb-8 leading-tight">
                  Work with <span className="text-[#D4AF37]">Fiezta</span> Today.
                </h2>
                <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-xl">
                  Ready to elevate your travel experience? Our concierge team is waiting to curate your perfect journey.
                </p>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#D4AF37]">
                      <Mail size={20} />
                    </div>
                    <span className="font-bold">{siteSettings?.contactEmail || 'concierge@fiezta.com'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#D4AF37]">
                      <Smartphone size={20} />
                    </div>
                    <span className="font-bold">{siteSettings?.contactPhone || '+1 (DMV) FIEZTA'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-2xl">
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                      <input type="text" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                      <input type="email" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Service Interest</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all appearance-none">
                      <option>Live Entertainment</option>
                      <option>Travel & Tours</option>
                      <option>Elite Rentals</option>
                      <option>DMV Concierge</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Message</label>
                    <textarea rows={4} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all resize-none" placeholder="How can we help you?"></textarea>
                  </div>
                  <button className="w-full py-5 bg-[#D4AF37] text-white rounded-2xl font-black text-lg hover:bg-amber-600 transition-all shadow-xl shadow-amber-200 uppercase tracking-widest">
                    Send Inquiry
                  </button>
                </form>
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
                  <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                    {siteSettings?.logoUrl ? (
                      <img src={siteSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <FieztaLogo className="w-10 h-10" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase leading-none">{siteSettings?.siteName || 'FIEZTA'}</span>
                    <span className="text-[10px] font-bold text-[#FF9900] uppercase tracking-widest mt-1">International</span>
                  </div>
                </div>
                <p className="text-slate-500 max-w-sm leading-relaxed">
                  {siteSettings?.siteDescription || 'Transforming the way you travel with automation, AI, and dedicated concierge services. Your journey starts here.'}
                </p>
              </div>
              <div>
                <h5 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Company</h5>
                <ul className="space-y-4">
                  {menus.find(m => m.location === 'footer-company')?.items.sort((a, b) => a.order - b.order).map(item => (
                    <li key={item.label}><a href={item.url} className="text-slate-500 hover:text-[#D4AF37] transition-colors">{item.label}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Support</h5>
                <ul className="space-y-4">
                  {menus.find(m => m.location === 'footer-support')?.items.sort((a, b) => a.order - b.order).map(item => (
                    <li key={item.label}><a href={item.url} className="text-slate-500 hover:text-[#D4AF37] transition-colors">{item.label}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-slate-400 text-sm">© 2026 {siteSettings?.siteName || 'Fiezta CMS'}. All rights reserved.</p>
              <div className="flex gap-6">
                {siteSettings?.facebook && <a href={siteSettings.facebook} className="text-slate-400 hover:text-primary transition-colors"><Facebook size={20} /></a>}
                {siteSettings?.instagram && <a href={siteSettings.instagram} className="text-slate-400 hover:text-primary transition-colors"><Instagram size={20} /></a>}
                {siteSettings?.twitter && <a href={siteSettings.twitter} className="text-slate-400 hover:text-primary transition-colors"><Twitter size={20} /></a>}
                {siteSettings?.youtube && <a href={siteSettings.youtube} className="text-slate-400 hover:text-primary transition-colors"><Youtube size={20} /></a>}
                {siteSettings?.linkedin && <a href={siteSettings.linkedin} className="text-slate-400 hover:text-primary transition-colors"><Linkedin size={20} /></a>}
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Backdrop for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isSidebarOpen ? 0 : -280,
          width: 280,
          opacity: 1
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 lg:relative z-40 lg:z-20 transition-all",
          !isSidebarOpen && "pointer-events-none lg:pointer-events-auto lg:w-0 lg:opacity-0"
        )}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden">
              {siteSettings?.logoUrl ? (
                <img src={siteSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <FieztaLogo className="w-9 h-9" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xl font-bold text-slate-900 truncate tracking-tight leading-none">{siteSettings?.siteName || 'Fiezta CMS'}</span>
              <span className="text-[9px] font-bold text-[#FF9900] uppercase tracking-wider mt-0.5">Agency Dashboard</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg lg:hidden"
          >
            <X size={20} />
          </button>
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
            active={activeTab === 'forms_popups'} 
            onClick={() => setActiveTab('forms_popups')} 
          />
          <SidebarItem 
            icon={Zap} 
            label="Marketing" 
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
            icon={Activity} 
            label="Posts" 
            active={activeTab === 'posts'} 
            onClick={() => setActiveTab('posts')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Pages" 
            active={activeTab === 'pages'} 
            onClick={() => setActiveTab('pages')} 
          />
          <SidebarItem 
            icon={MenuIcon} 
            label="Menus" 
            active={activeTab === 'menus'} 
            onClick={() => setActiveTab('menus')} 
          />
          <SidebarItem 
            icon={Lightbulb} 
            label="Inventions" 
            active={activeTab === 'inventions'} 
            onClick={() => setActiveTab('inventions')} 
          />
          <SidebarItem 
            icon={Smartphone} 
            label="Social Scheduler" 
            active={activeTab === 'social'} 
            onClick={() => setActiveTab('social')} 
          />
          <SidebarItem 
            icon={Youtube} 
            label="Vlog Manager" 
            active={activeTab === 'vlogs'} 
            onClick={() => setActiveTab('vlogs')} 
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
            icon={Briefcase} 
            label="Services" 
            active={activeTab === 'services'} 
            onClick={() => setActiveTab('services')} 
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
                icon={Shield} 
                label="Role Manager" 
                active={activeTab === 'roles'} 
                onClick={() => setActiveTab('roles')} 
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
              <SidebarItem 
                icon={Database} 
                label="Data Management" 
                active={activeTab === 'crud'} 
                onClick={() => setActiveTab('crud')} 
              />
            </>
          )}

          <SidebarItem 
            icon={Globe} 
            label="Interactive Map" 
            active={isWorldMapOpen} 
            onClick={() => setIsWorldMapOpen(true)} 
          />
          <SidebarItem 
            icon={Sparkles} 
            label="Itinerary Builder" 
            active={isItineraryBuilderOpen} 
            onClick={() => setIsItineraryBuilderOpen(true)} 
          />
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System</div>
          <SidebarItem 
            icon={Sparkles} 
            label="AI Assistant" 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
          />
          <SidebarItem 
            icon={Palette} 
            label="Theme Manager" 
            active={activeTab === 'themes'} 
            onClick={() => setActiveTab('themes')} 
          />
          <SidebarItem 
            icon={Mail} 
            label="Newsletter" 
            active={activeTab === 'newsletter'} 
            onClick={() => setActiveTab('newsletter')} 
          />
          <SidebarItem 
            icon={UserIcon} 
            label="My Profile" 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Site Settings" 
            active={activeTab === 'site_settings'} 
            onClick={() => setActiveTab('site_settings')} 
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
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 z-10 shrink-0">
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <MenuIcon size={20} />
            </button>
            <h2 className="text-sm lg:text-lg font-bold text-slate-900 capitalize truncate max-w-[120px] sm:max-w-none">{activeTab.replace('_', ' ')}</h2>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative hidden xl:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-48 xl:w-64 transition-all"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative">
              <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></div>
              <AlertCircle size={20} />
            </button>
            <div className="md:hidden">
              <img 
                src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
                className="w-8 h-8 rounded-full border border-slate-200" 
                alt="Avatar" 
              />
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl lg:text-2xl font-black tracking-tighter text-slate-900">Control Center</h1>
                    <p className="text-slate-500 text-xs sm:text-sm">Real-time overview of Fiezta's performance.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button 
                      onClick={() => setIsWorldMapOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                    >
                      <Globe size={14} className="sm:w-4 sm:h-4" />
                      Explore Map
                    </button>
                    <button 
                      onClick={() => setIsItineraryBuilderOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                    >
                      <Sparkles size={14} className="sm:w-4 sm:h-4" />
                      AI Journey Architect
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                      <Download size={14} className="sm:w-4 sm:h-4" />
                      Export
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                      <TrendingUp size={14} className="sm:w-4 sm:h-4" />
                      Report
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <DollarSign size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+18.2%</span>
                        <span className="text-[8px] sm:text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest text-right">vs last month</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Total Revenue</p>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1">
                      {formatCurrency(bookings.reduce((acc, b) => acc + (b.paidAmount || 0), 0))}
                    </h3>
                  </div>
                  
                  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Briefcase size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">+5.4%</span>
                        <span className="text-[8px] sm:text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest text-right">vs last month</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Total Bookings</p>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1">{bookings.length}</h3>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Active</span>
                        <span className="text-[8px] sm:text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest text-right">currently online</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Active Clients</p>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1">{clients.length}</h3>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Award size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">98%</span>
                        <span className="text-[8px] sm:text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest text-right">satisfaction</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Success Rate</p>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1">94.2%</h3>
                  </div>
                </div>

                {/* Charts & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">Revenue Growth</h3>
                        <p className="text-slate-500 text-xs sm:text-sm">Monthly performance tracking.</p>
                      </div>
                      <div className="flex gap-1 sm:gap-2">
                        <button className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] sm:text-xs font-bold">1W</button>
                        <button className="flex-1 sm:flex-none px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] sm:text-xs font-bold shadow-md shadow-indigo-100">1M</button>
                        <button className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] sm:text-xs font-bold">1Y</button>
                      </div>
                    </div>
                    <div className="h-60 sm:h-80 w-full overflow-hidden">
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
                      {activityLogs.length > 0 ? activityLogs.slice(0, 6).map((log, idx) => (
                        <div key={`${log.id}-${idx}`} className="flex gap-4 relative">
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
                        <tr className="bg-background/50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Package</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.slice(0, 5).map((booking, idx) => (
                          <tr key={`${booking.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
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
                {(profile?.role === 'super_admin' || profile?.role === 'admin') ? (
                  <GenericCRUD 
                    entityName="Package" 
                    collectionName="packages" 
                    agencyId={agencyId || ''} 
                    fields={packageFields as any}
                    displayFields={['title', 'destination', 'price', 'status']}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-slate-900">Travel Packages</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {packages.length > 0 ? packages.map((pkg, idx) => (
                        <motion.div 
                          key={`${pkg.id}-${idx}`}
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
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'pages' && (
              <motion.div 
                key="pages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GenericCRUD 
                  entityName="Page" 
                  collectionName="pages" 
                  agencyId={agencyId || ''} 
                  fields={pageFields as any}
                  displayFields={['title', 'slug', 'status']}
                />
              </motion.div>
            )}

            {activeTab === 'menus' && (
              <motion.div 
                key="menus"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GenericCRUD 
                  entityName="Menu" 
                  collectionName="menus" 
                  agencyId={agencyId || ''} 
                  fields={menuFields as any}
                  displayFields={['title', 'location', 'isActive']}
                />
              </motion.div>
            )}

            {activeTab === 'posts' && (
              <motion.div 
                key="posts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GenericCRUD 
                  entityName="Post" 
                  collectionName="posts" 
                  agencyId={agencyId || ''} 
                  fields={postFields as any}
                  displayFields={['title', 'status']}
                  allowFiltering={true}
                  allowSorting={true}
                />
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div 
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GenericCRUD 
                  entityName="Service" 
                  collectionName="services" 
                  agencyId={agencyId || ''} 
                  fields={serviceFields as any}
                  displayFields={['name', 'category', 'price']}
                />
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
                  
                  {chatMessages.map((msg) => (
                    <motion.div 
                      key={msg.id}
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
                        {bookings.length > 0 ? bookings.map((booking, idx) => (
                          <tr 
                            key={`${booking.id}-${idx}`} 
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
              className="h-full flex flex-col gap-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tighter text-slate-900">Internal Messaging</h1>
                  <p className="text-slate-500 text-sm">Secure communication between staff members.</p>
                </div>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all w-full sm:w-auto">
                  <Plus size={20} />
                  New Message
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[300px] lg:max-h-full transition-all">
                  <div className="p-4 sm:p-6 border-b border-slate-100">
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
                    {messages.length > 0 ? messages.map((msg, idx) => (
                      <div key={`${msg.id}-${idx}`} className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0">
                          {msg.senderName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{msg.senderName}</h4>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

                <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
                  <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black">
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
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs shrink-0">S</div>
                      <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl rounded-tl-none max-w-[90%] sm:max-w-[80%]">
                        <p className="text-xs sm:text-sm text-slate-700">Hi team, we have a new booking for the Santorini package. Can someone check the availability for the luxury villa?</p>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0">Y</div>
                      <div className="bg-indigo-600 p-3 sm:p-4 rounded-2xl rounded-tr-none max-w-[90%] sm:max-w-[80%] text-white shadow-lg shadow-indigo-100">
                        <p className="text-xs sm:text-sm">I'm on it! Checking with the provider now.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 border-t border-slate-100">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Type your message..."
                        className="w-full pl-6 pr-14 py-3 sm:py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm"
                      />
                      <button className="absolute right-2 top-2 p-2 sm:p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                        <Send size={18} className="sm:w-5 sm:h-5" />
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
                          {subscribers.map((sub, idx) => (
                            <tr key={`${sub.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
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
                  {accommodations.map((acc, idx) => (
                    <div key={`${acc.id}-${idx}`} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
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
                  {transport.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
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


            {activeTab === 'invoices' && (
              <motion.div 
                key="invoices"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GenericCRUD 
                  entityName="Invoice" 
                  collectionName="invoices" 
                  agencyId={agencyId || ''} 
                  fields={invoiceFields as any}
                  displayFields={['bookingId', 'amount', 'status', 'dueDate']}
                />
              </motion.div>
            )}



            {activeTab === 'staff' && (
              <motion.div 
                key="staff"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GenericCRUD 
                  entityName="Staff" 
                  collectionName="users" 
                  agencyId={agencyId || ''} 
                  fields={staffFields as any}
                  displayFields={['displayName', 'email', 'role']}
                  fixedFilters={{ role: ['agent', 'accountant', 'support', 'admin'] }}
                />
              </motion.div>
            )}

            {activeTab === 'roles' && (
              <motion.div 
                key="roles"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <RoleManager agencyId={agencyId} />
              </motion.div>
            )}
            {activeTab === 'clients' && (
              <motion.div 
                key="clients"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GenericCRUD 
                  entityName="Client" 
                  collectionName="users" 
                  agencyId={agencyId || ''} 
                  fields={clientFields as any}
                  displayFields={['displayName', 'email', 'phoneNumber']}
                  fixedFilters={{ role: 'client' }}
                />
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GenericCRUD 
                  entityName="Task" 
                  collectionName="tasks" 
                  agencyId={agencyId || ''} 
                  fields={taskFields as any}
                  displayFields={['title', 'status', 'dueDate']}
                />
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
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[600px]">
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
                        {wpPosts.length > 0 ? wpPosts.map((post, idx) => (
                          <div key={`${post.id}-${idx}`} className="p-6 hover:bg-slate-50 transition-colors group">
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

            {activeTab === 'inventions' && (
              <motion.div 
                key="inventions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GenericCRUD 
                  entityName="Invention" 
                  collectionName="inventions" 
                  agencyId={agencyId || ''} 
                  fields={inventionFields as any}
                  displayFields={['title', 'status']}
                  allowFiltering={true}
                  allowSorting={true}
                />
              </motion.div>
            )}

            {activeTab === 'social' && (
              <SocialDashboard agencyId={agencyId!} />
            )}

            {activeTab === 'vlogs' && (
              <VlogManagement agencyId={agencyId!} />
            )}

            {activeTab === 'themes' && (
              <ThemeManager agencyId={agencyId!} />
            )}

            {activeTab === 'crud' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'Services', collection: 'services', fields: serviceFields, display: ['name', 'category', 'price', 'isActive'] },
                    { name: 'Reviews', collection: 'reviews', fields: reviewFields, display: ['customerName', 'rating'] },
                    { name: 'FAQs', collection: 'faqs', fields: faqFields, display: ['question', 'order'] },
                    { name: 'Pages', collection: 'pages', fields: pageFields, display: ['title', 'slug', 'status'] },
                    { name: 'Inventions', collection: 'inventions', fields: inventionFields, display: ['title', 'status'] },
                    { name: 'Menus', collection: 'menus', fields: menuFields, display: ['title', 'location', 'isActive'] },
                    { name: 'Destinations', collection: 'destinations', fields: [
                      { name: 'name', label: 'Name', type: 'text', required: true },
                      { name: 'description', label: 'Description', type: 'textarea' },
                      { name: 'imageUrl', label: 'Image URL', type: 'url' }
                    ], display: ['name', 'description'] },
                    { name: 'Coupons', collection: 'coupons', fields: [
                      { name: 'code', label: 'Code', type: 'text', required: true },
                      { name: 'discountValue', label: 'Discount', type: 'number', required: true },
                      { name: 'discountType', label: 'Type', type: 'select', options: ['percentage', 'fixed'] },
                      { name: 'isActive', label: 'Active', type: 'boolean' }
                    ], display: ['code', 'discountValue', 'isActive'] },
                    { name: 'Subscribers', collection: 'subscribers', fields: [
                      { name: 'email', label: 'Email', type: 'text', required: true },
                      { name: 'status', label: 'Status', type: 'select', options: ['active', 'unsubscribed'] }
                    ], display: ['email', 'status'] }
                  ].map((entity) => (
                    <button
                      key={entity.name}
                      onClick={() => setSelectedCrudEntity(entity)}
                      className="p-8 bg-white rounded-[32px] border border-slate-100 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center mb-6 transition-all">
                        <Database size={24} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">{entity.name}</h3>
                      <p className="text-sm text-slate-500">Manage all {entity.name.toLowerCase()} records in the database.</p>
                    </button>
                  ))}
                </div>

                {selectedCrudEntity && (
                  <div className="mt-12 pt-12 border-t border-slate-100">
                    <GenericCRUD 
                      agencyId={agencyId!}
                      entityName={selectedCrudEntity.name}
                      collectionName={selectedCrudEntity.collection}
                      fields={selectedCrudEntity.fields as any}
                      displayFields={selectedCrudEntity.display}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'site_settings' && (
              <motion.div 
                key="site_settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="space-y-8">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">Site Settings</h1>
                    <p className="text-slate-500 text-sm">Manage your agency's branding, contact information, and general site configuration.</p>
                  </div>
                  <GenericCRUD 
                    entityName="Site Setting" 
                    collectionName="site_settings" 
                    agencyId={agencyId || ''} 
                    fields={siteSettingsFields as any}
                    displayFields={['siteName', 'contactEmail', 'contactPhone']}
                  />
                </div>
              </motion.div>
            )}
            {activeTab === 'audit' && (
              <motion.div 
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
                        {auditLogs.length > 0 ? auditLogs.map((log, idx) => (
                          <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
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

            {activeTab === 'forms_popups' && (
              <motion.div 
                key="forms_popups"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-2xl font-black tracking-tighter text-slate-900">Forms & Popups</h1>
                  <p className="text-slate-500 text-sm">Create and manage your lead capture forms and dynamic popup campaigns.</p>
                </div>

                <div className="space-y-12">
                  <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-indigo-600" />
                      Custom Forms
                    </h3>
                    <GenericCRUD 
                      entityName="Form" 
                      collectionName="custom_forms" 
                      agencyId={agencyId || ''} 
                      fields={customFormFields as any}
                      displayFields={['title', 'createdAt']}
                    />
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <MousePointer2 size={20} className="text-amber-500" />
                      Popup Campaigns
                    </h3>
                    <GenericCRUD 
                      entityName="Popup" 
                      collectionName="popup_campaigns" 
                      agencyId={agencyId || ''} 
                      fields={popupCampaignFields as any}
                      displayFields={['title', 'type', 'trigger', 'isActive']}
                    />
                  </section>
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

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
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
          {isItineraryBuilderOpen && profile && (
            <AIItineraryBuilder 
              user={profile} 
              onClose={() => setIsItineraryBuilderOpen(false)} 
            />
          )}

          {isWorldMapOpen && (
            <InteractiveMap 
              packages={packages} 
              onSelectPackage={(pkg) => {
                setSelectedPackage(pkg);
                setIsWorldMapOpen(false);
                setIsBookingModalOpen(true);
              }} 
              onClose={() => setIsWorldMapOpen(false)}
            />
          )}

          {isBookingModalOpen && profile && (
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
