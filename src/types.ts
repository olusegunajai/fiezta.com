export interface WPPost {
  id: string;
  agencyId: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  status: 'publish' | 'draft';
  author?: string;
  featuredImage?: string;
  link?: string;
}

export interface Page {
  id: string;
  agencyId: string;
  title: string;
  slug: string;
  content: string;
  status: 'publish' | 'draft';
  createdAt: string;
}

export interface MenuItem {
  label: string;
  url: string;
  order: number;
}

export interface Menu {
  id: string;
  agencyId: string;
  title: string;
  location: string;
  items: MenuItem[];
  isActive: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  agencyId: string;
  name: string;
  description: string;
  price: number;
  category: 'visa' | 'insurance' | 'tour' | 'other';
  createdAt: string;
}

export interface WPConfig {
  agencyId: string;
  url: string;
  apiKey: string;
  status: 'connected' | 'disconnected';
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'select' | 'date' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface CustomForm {
  id: string;
  agencyId: string;
  title: string;
  fields: FormField[];
  submitUrl?: string;
  createdAt: string;
}

export interface PopupCampaign {
  id: string;
  agencyId: string;
  title: string;
  type: 'discount' | 'offer' | 'lead_capture';
  content: string;
  trigger: 'exit_intent' | 'time_delay' | 'scroll_depth';
  isActive: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  agencyId: string;
  title: string;
  start: string;
  end: string;
  type: 'booking' | 'staff_schedule' | 'travel_timeline';
  color?: string;
}

export type UserRole = 'super_admin' | 'admin' | 'agent' | 'accountant' | 'support' | 'client' | string;

export interface Role {
  id: string;
  agencyId: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  agencyId: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
  preferences?: {
    destinations: string[];
    budget: 'budget' | 'mid-range' | 'luxury';
    travelType: 'solo' | 'family' | 'group' | 'business';
    dietary?: string[];
    specialNeeds?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  aiInsights?: string;
  performanceMetrics?: {
    bookingsHandled: number;
    revenueGenerated: number;
    customerRating: number;
    tasksCompleted: number;
  };
  loyaltyPoints: number;
  referralCode?: string;
  referredBy?: string;
  notes?: string;
  createdAt: string;
}

export interface Agency {
  id: string;
  name: string;
  logo?: string;
  subscription: 'free' | 'pro' | 'enterprise';
  settings: {
    theme: 'light' | 'dark' | 'custom';
    primaryColor: string;
    webhookUrl?: string;
  };
  createdAt: string;
}

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'x' | 'threads';

export interface SocialAccount {
  id: string;
  agencyId: string;
  platform: SocialPlatform;
  accountName: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  profilePicture?: string;
  status: 'active' | 'expired' | 'disconnected';
  createdAt: string;
}

export interface SocialPost {
  id: string;
  agencyId: string;
  accountId: string;
  content: string;
  platforms: SocialPlatform[];
  mediaUrls?: string[];
  type: 'post' | 'reel' | 'short' | 'story';
  scheduledAt: string;
  status: 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'failed';
  failureReason?: string;
  assignedTo?: string;
  campaignId?: string;
  packageId?: string;
  analytics?: {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
    impressions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SocialCampaign {
  id: string;
  agencyId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export interface SocialMessage {
  id: string;
  agencyId: string;
  accountId: string;
  platform: SocialPlatform;
  senderId: string;
  senderName: string;
  content: string;
  type: 'comment' | 'dm';
  status: 'unread' | 'read' | 'replied' | 'assigned';
  assignedTo?: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  agencyId: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: string;
  timestamp: string;
}

export interface Coupon {
  id: string;
  agencyId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minBookingAmount?: number;
  expiryDate: string;
  usageCount: number;
  usageLimit?: number;
  isActive: boolean;
}

export interface InternalMessage {
  id: string;
  agencyId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: string;
  createdAt: string;
  read: boolean;
}

export interface Accommodation {
  id: string;
  agencyId: string;
  type: 'hotel' | 'apartment';
  name: string;
  location: string;
  stars: number;
  pricePerNight: number;
  amenities: string[];
  images: string[];
  imageUrl?: string;
}

export interface Transport {
  id: string;
  agencyId: string;
  type: 'flight' | 'train' | 'bus' | 'car';
  provider: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  imageUrl?: string;
  model?: string;
  capacity?: number;
}

export interface Destination {
  id: string;
  agencyId: string;
  name: string;
  country: string;
  description: string;
  image: string;
  tags: string[];
}

export interface TravelPackage {
  id: string;
  agencyId: string;
  title: string;
  description: string;
  destinations: string[];
  destination?: string;
  duration: number;
  price: number;
  image: string;
  imageUrl?: string;
  itinerary: { day: number; title: string; description: string }[];
  inclusions: string[];
  exclusions: string[];
  status: 'active' | 'draft' | 'archived';
}

export type BookingStatus = 'draft' | 'pending' | 'processing' | 'approved' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  agencyId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  packageId: string;
  packageName: string;
  travelDate: string;
  passengers: number;
  travelerDetails?: { name: string; email: string; phone: string; passport: string }[];
  totalAmount: number;
  paidAmount: number;
  status: BookingStatus;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  notes?: string;
  currentStep?: number;
  isDraft?: boolean;
  documents?: string[];
  visaAssistance?: {
    required: boolean;
    status: 'not_started' | 'in_progress' | 'approved' | 'rejected';
    notes?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  agencyId: string;
  bookingId: string;
  clientId: string;
  amount: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
}

export interface Payment {
  id: string;
  agencyId: string;
  bookingId: string;
  amount: number;
  method: 'card' | 'bank_transfer' | 'cash';
  status: 'pending' | 'success' | 'failed';
  transactionId?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  agencyId: string;
  clientId: string;
  clientName: string;
  bookingId?: string;
  title: string;
  type: 'passport' | 'visa' | 'ticket' | 'invoice' | 'other';
  fileUrl: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  expiryDate?: string;
  createdAt: string;
}

export interface StaffTask {
  id: string;
  agencyId: string;
  assignedTo: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  agencyId: string;
  email: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  agencyId: string;
  name: string;
  trigger: 'booking_created' | 'payment_received' | 'status_changed';
  action: 'send_email' | 'create_task' | 'webhook';
  config: any;
  isActive: boolean;
}

export interface PaymentTransaction {
  id: string;
  agencyId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed';
  method: string;
  createdAt: string;
}

export interface Vlog {
  id: string;
  agencyId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  views: number;
  publishedAt: string;
  status: 'published' | 'draft';
  createdAt: string;
}

export interface Theme {
  id: string;
  agencyId: string;
  name: string;
  description?: string;
  config: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    borderRadius: string;
    glassmorphism: boolean;
  };
  isAdminTheme: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface SiteSettings {
  id: string;
  agencyId: string;
  siteName: string;
  siteDescription: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  agencyId: string;
  userId: string;
  userName?: string;
  action: string;
  details?: string;
  timestamp: string;
}
