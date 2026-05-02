import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Users, 
  FileText, 
  ShieldCheck, 
  CreditCard,
  CheckCircle2,
  Upload,
  X,
  Plus,
  Loader2,
  Globe
} from 'lucide-react';
import { TravelPackage, Booking, UserProfile } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

interface BookingWizardProps {
  pkg: TravelPackage | null;
  user: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = [
  { id: 1, title: 'Select Package', icon: Globe },
  { id: 2, title: 'Travel Details', icon: Calendar },
  { id: 3, title: 'Travelers', icon: Users },
  { id: 4, title: 'Documents', icon: FileText },
  { id: 5, title: 'Visa Assistance', icon: ShieldCheck },
  { id: 6, title: 'Review & Pay', icon: CreditCard },
];

export const BookingWizard: React.FC<BookingWizardProps> = ({ pkg, user, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(pkg ? 2 : 1);
  const [selectedPkg, setSelectedPkg] = useState<TravelPackage | null>(pkg);
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [formData, setFormData] = useState({
    travelDate: '',
    travelers: 1,
    travelerDetails: [{ name: user.displayName, email: user.email, phone: user.phoneNumber || '', passport: '' }],
    notes: '',
    visaRequired: false,
    documents: [] as string[],
    isDraft: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  useEffect(() => {
    if (!selectedPkg && currentStep === 1) {
      const fetchPackages = async () => {
        setIsLoadingPackages(true);
        try {
          const q = query(collection(db, 'packages'), where('status', '==', 'active'));
          const snapshot = await getDocs(q);
          setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TravelPackage[]);
        } catch (error) {
          console.error("Error fetching packages:", error);
        } finally {
          setIsLoadingPackages(false);
        }
      };
      fetchPackages();
    }
  }, [selectedPkg, currentStep]);

  const handleNext = () => {
    if (currentStep === 1 && !selectedPkg) return;
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, pkg ? 2 : 1));

  const updateTravelerCount = (count: number) => {
    const newCount = Math.max(1, count);
    setFormData(prev => {
      const newDetails = [...prev.travelerDetails];
      if (newCount > prev.travelerDetails.length) {
        for (let i = prev.travelerDetails.length; i < newCount; i++) {
          newDetails.push({ name: '', email: '', phone: '', passport: '' });
        }
      } else {
        newDetails.splice(newCount);
      }
      return { ...prev, travelers: newCount, travelerDetails: newDetails };
    });
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!selectedPkg) return;
    setIsSubmitting(true);
    try {
      const bookingData: Omit<Booking, 'id'> = {
        agencyId: selectedPkg.agencyId,
        clientId: user.uid,
        clientName: user.displayName,
        clientEmail: user.email,
        packageId: selectedPkg.id,
        packageName: selectedPkg.title,
        status: isDraft ? 'draft' : 'pending',
        travelDate: formData.travelDate || new Date().toISOString(),
        passengers: formData.travelers,
        travelerDetails: formData.travelerDetails,
        notes: formData.notes,
        totalAmount: selectedPkg.price * formData.travelers,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        currentStep,
        isDraft,
        documents: formData.documents,
        visaAssistance: {
          required: formData.visaRequired,
          status: formData.visaRequired ? 'not_started' : 'approved',
          notes: ''
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 sm:border sm:border-amber-500/20 sm:rounded-[32px] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif text-amber-500">Book Your Journey</h2>
            <p className="text-zinc-500 text-xs sm:text-sm">
              {selectedPkg ? `Experience ${selectedPkg.title} with Fiezta Royal Service.` : 'Select your dream destination to begin.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400">
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-black/40 border-b border-white/5 overflow-x-auto custom-scrollbar shrink-0">
          <div className="flex items-center justify-between relative min-w-[500px] sm:min-w-0">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-amber-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isActive ? "bg-amber-500 border-amber-500 text-black scale-110 shadow-lg shadow-amber-500/20" : 
                    isCompleted ? "bg-amber-500/20 border-amber-500 text-amber-500" : 
                    "bg-zinc-800 border-white/10 text-zinc-500"
                  )}>
                    {isCompleted ? <CheckCircle2 size={16} className="sm:w-5 sm:h-5" /> : <Icon size={16} className="sm:w-5 sm:h-5" />}
                  </div>
                  <span className={cn(
                    "text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-2 whitespace-nowrap",
                    isActive ? "text-amber-500" : "text-zinc-500"
                  )}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Select a Travel Package</h3>
                  {isLoadingPackages ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="animate-spin text-amber-500" size={40} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {packages.map((p, idx) => (
                        <button
                          key={`${p.id}-${idx}`}
                          onClick={() => {
                            setSelectedPkg(p);
                            handleNext();
                          }}
                          className={cn(
                            "group relative bg-zinc-800/50 border rounded-3xl overflow-hidden transition-all text-left",
                            selectedPkg?.id === p.id ? "border-amber-500 ring-2 ring-amber-500/20" : "border-white/5 hover:border-white/20"
                          )}
                        >
                          <div className="aspect-video overflow-hidden">
                            <img src={p.imageUrl || 'https://picsum.photos/seed/travel/800/600'} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                          </div>
                          <div className="p-6">
                            <h4 className="font-bold text-white mb-1">{p.title}</h4>
                            <p className="text-xs text-zinc-500 mb-4">{p.destination}</p>
                            <p className="text-lg font-black text-amber-500">{formatCurrency(p.price)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preferred Travel Date</label>
                      <input 
                        type="date" 
                        value={formData.travelDate}
                        onChange={(e) => setFormData({...formData, travelDate: e.target.value})}
                        className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Number of Travelers</label>
                      <input 
                        type="number" 
                        min="1"
                        value={formData.travelers}
                        onChange={(e) => updateTravelerCount(parseInt(e.target.value))}
                        className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Special Requests / Notes</label>
                    <textarea 
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Any specific requirements or preferences?"
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Traveler Details</h3>
                  <div className="space-y-4">
                    {formData.travelerDetails.map((traveler, index) => (
                      <div key={`${index}-${traveler.email}`} className="bg-zinc-800/50 border border-white/5 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-amber-500 flex items-center gap-2">
                            <Users size={18} />
                            Traveler {index + 1} {index === 0 && "(Primary)"}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            placeholder="Full Name"
                            value={traveler.name}
                            onChange={(e) => {
                              const newDetails = [...formData.travelerDetails];
                              newDetails[index].name = e.target.value;
                              setFormData({...formData, travelerDetails: newDetails});
                            }}
                            className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                          />
                          <input 
                            placeholder="Email Address"
                            value={traveler.email}
                            onChange={(e) => {
                              const newDetails = [...formData.travelerDetails];
                              newDetails[index].email = e.target.value;
                              setFormData({...formData, travelerDetails: newDetails});
                            }}
                            className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                          />
                          <input 
                            placeholder="Phone Number"
                            value={traveler.phone}
                            onChange={(e) => {
                              const newDetails = [...formData.travelerDetails];
                              newDetails[index].phone = e.target.value;
                              setFormData({...formData, travelerDetails: newDetails});
                            }}
                            className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                          />
                          <input 
                            placeholder="Passport Number"
                            value={traveler.passport}
                            onChange={(e) => {
                              const newDetails = [...formData.travelerDetails];
                              newDetails[index].passport = e.target.value;
                              setFormData({...formData, travelerDetails: newDetails});
                            }}
                            className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="p-12 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center hover:border-amber-500/50 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 mb-4 group-hover:text-amber-500 transition-colors">
                      <Upload size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Upload Documents</h4>
                    <p className="text-sm text-zinc-500 max-w-xs">Upload passport copies, IDs, or any other travel documents required for this trip.</p>
                  </div>
                  <div className="flex items-center gap-2 text-amber-500/60 text-xs italic">
                    <ShieldCheck size={14} />
                    Your documents are stored securely and encrypted.
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="bg-zinc-800/50 border border-white/5 rounded-3xl p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <ShieldCheck size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-white mb-2">Visa Assistance Program</h4>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                          Fiezta offers premium visa assistance for this destination. Our experts will handle the paperwork, scheduling, and follow-ups for you.
                        </p>
                        <button 
                          onClick={() => setFormData({...formData, visaRequired: !formData.visaRequired})}
                          className={cn(
                            "flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all",
                            formData.visaRequired ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 border border-white/10"
                          )}
                        >
                          {formData.visaRequired ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                          {formData.visaRequired ? "Assistance Requested" : "Request Visa Assistance"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && selectedPkg && (
                <div className="space-y-8">
                  <div className="bg-zinc-800/50 border border-white/5 rounded-3xl p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-2xl font-serif text-white">{selectedPkg.title}</h4>
                        <p className="text-zinc-500">{selectedPkg.destination} • {selectedPkg.duration}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-amber-500">{formatCurrency(selectedPkg.price * formData.travelers)}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Total for {formData.travelers} traveler(s)</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                      <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Travel Date</p>
                        <p className="text-white">{formData.travelDate || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Visa Assistance</p>
                        <p className="text-white">{formData.visaRequired ? 'Yes' : 'No'}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Travelers</p>
                      <div className="space-y-1">
                        {formData.travelerDetails.map((t, i) => (
                          <p key={`summary-traveler-${i}`} className="text-sm text-white">{t.name || 'Unnamed Traveler'} ({t.email || 'No Email'})</p>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
                    <CreditCard className="text-amber-500 shrink-0" size={24} />
                    <div>
                      <h5 className="font-bold text-amber-500 mb-1">Payment Method</h5>
                      <p className="text-zinc-400 text-sm">You can pay securely via Paystack, Stripe, or Flutterwave after submitting your request.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-black/20 flex items-center justify-between">
          <button 
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || !selectedPkg}
            className="text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest disabled:opacity-30"
          >
            Save as Draft
          </button>
          
          <div className="flex items-center gap-4">
            {currentStep > (pkg ? 2 : 1) && (
              <button 
                onClick={handleBack}
                className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all flex items-center gap-2"
              >
                <ChevronLeft size={20} /> Back
              </button>
            )}
            
            {currentStep < steps.length ? (
              <button 
                onClick={handleNext}
                disabled={currentStep === 1 && !selectedPkg}
                className="px-8 py-3 bg-amber-500 text-black rounded-xl font-bold hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                Next Step <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !selectedPkg}
                className="px-8 py-3 bg-amber-500 text-black rounded-xl font-bold hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                Confirm Booking
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
