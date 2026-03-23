import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, 
  User, 
  Sparkles, 
  Wind, 
  Hand, 
  Phone, 
  MapPin, 
  Instagram, 
  Facebook, 
  MessageCircle,
  Calendar,
  Clock,
  ChevronRight,
  Star,
  LogOut,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Shield,
  Plus,
  Trash2,
  Send,
  Bell,
  X
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
  orderBy,
  limit,
  deleteDoc,
  handleFirestoreError,
  OperationType
} from './firebase';

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong. Please refresh the page.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error.includes("insufficient permissions")) {
          displayMessage = "You don't have permission to perform this action.";
        }
      } catch {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-barber-cream p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 vintage-overlay opacity-20 pointer-events-none" />
          <div className="max-w-md bg-white p-8 rounded-3xl shadow-2xl border-2 border-barber-gold/30 relative z-10">
            <AlertCircle className="w-16 h-16 text-barber-red mx-auto mb-4" />
            <h2 className="text-3xl font-display text-barber-black mb-2 tracking-wider">Oops!</h2>
            <p className="text-barber-black/70 mb-6 font-sans">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-barber-black text-barber-gold px-8 py-3 rounded-full font-display text-xl tracking-widest hover:bg-barber-red hover:text-white transition-all shadow-lg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Subscribe Page ---

const SubscribePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: [] as string[]
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail) return;

    setStatus('loading');
    try {
      const subscriberRef = doc(db, 'subscribers', cleanEmail);
      let docSnap;
      try {
        docSnap = await getDoc(subscriberRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `subscribers/${cleanEmail}`);
      }

      if (docSnap && docSnap.exists()) {
        setStatus('error');
        setMessage('You are already subscribed!');
        return;
      }

      try {
        await setDoc(subscriberRef, {
          ...formData,
          email: cleanEmail,
          subscribedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `subscribers/${cleanEmail}`);
      }

      setStatus('success');
      setMessage('Successfully subscribed! Welcome to the family.');
    } catch (error) {
      console.error('Subscription error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  const togglePreference = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(pref)
        ? prev.preferences.filter(p => p !== pref)
        : [...prev.preferences, pref]
    }));
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-barber-cream flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 vintage-overlay opacity-20 pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-3xl shadow-2xl text-center border-2 border-barber-gold relative z-10"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-4xl font-display text-barber-black font-bold mb-4 tracking-wider">You're In!</h2>
          <p className="text-barber-black/70 mb-8 font-sans">{message}</p>
          
          <div className="bg-barber-cream/50 p-6 rounded-2xl mb-8 flex flex-col items-center border border-barber-gold/20">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-red/50 mb-4">Your Member QR Code</p>
            <QRCodeCanvas 
              value={`subscriber:${formData.email}`} 
              size={160}
              level="H"
              includeMargin={true}
              className="rounded-lg shadow-sm"
            />
            <p className="mt-4 text-[10px] text-barber-black/40 uppercase tracking-widest font-bold">Show this at the salon for exclusive perks</p>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-barber-black text-barber-gold py-4 rounded-xl font-display text-xl tracking-widest hover:bg-barber-red hover:text-white transition-all shadow-lg"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-barber-cream py-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 vintage-overlay opacity-20 pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto relative z-10"
      >
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-barber-red font-display text-xl tracking-widest mb-8 hover:translate-x-[-4px] transition-transform"
        >
          <ChevronRight className="rotate-180" size={20} />
          Back to Home
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-barber-gold/20"
        >
          <div className="bg-barber-black p-12 text-center relative">
            <div className="absolute top-0 left-0 w-full h-1 barber-pole-border opacity-50" />
            <h1 className="text-5xl font-display text-barber-gold font-bold mb-2 tracking-wider">Join the Inner Circle</h1>
            <p className="text-barber-gold/60 font-sans tracking-wide">Get exclusive offers, style tips, and priority booking.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-black/60">Full Name</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-barber-cream/50 border-2 border-barber-gold/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-barber-gold focus:border-transparent transition-all font-sans"
                  placeholder="John Doe"
                />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-black/60">Email Address</label>
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-barber-cream/50 border-2 border-barber-gold/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-barber-gold focus:border-transparent transition-all font-sans"
                  placeholder="john@example.com"
                />
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-black/60">Phone Number</label>
              <input 
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-barber-cream/50 border-2 border-barber-gold/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-barber-gold focus:border-transparent transition-all font-sans"
                placeholder="+91 00000 00000"
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-black/60 block">Interests</label>
              <div className="flex flex-wrap gap-3">
                {['Hair Styling', 'Beard Grooming', 'Facial Care', 'Exclusive Events', 'Product Deals'].map((pref, i) => (
                  <motion.button
                    key={pref}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + (i * 0.05) }}
                    type="button"
                    onClick={() => togglePreference(pref)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border-2 ${
                      formData.preferences.includes(pref)
                        ? 'bg-barber-red text-white border-barber-red shadow-md'
                        : 'bg-transparent text-barber-black border-barber-gold/30 hover:border-barber-gold'
                    }`}
                  >
                    {pref}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-sans"
              >
                <AlertCircle size={18} />
                {message}
              </motion.div>
            )}

            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-barber-black text-barber-gold py-5 rounded-2xl font-display text-2xl tracking-widest hover:bg-barber-red hover:text-white transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {status === 'loading' ? (
                <div className="w-6 h-6 border-2 border-barber-gold border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Subscribe Now
                  <Sparkles size={20} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

// --- Components ---

const Logo = () => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    animate={{ 
      y: [0, -5, 0],
    }}
    transition={{ 
      y: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }}
    className="flex items-center gap-2 group cursor-pointer"
  >
    <div className="relative">
      <div className="w-10 h-10 bg-barber-red rounded-full flex items-center justify-center border-2 border-barber-gold transition-transform group-hover:rotate-12 shadow-lg">
        <Scissors className="text-barber-gold" size={20} />
      </div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -top-1 -right-1 w-3 h-3 bg-barber-gold rounded-full border border-barber-black" 
      />
    </div>
    <div className="flex flex-col">
      <span className="font-display text-barber-black font-bold text-2xl leading-none tracking-wider">GANAPATHI</span>
      <span className="text-barber-gold text-[10px] uppercase tracking-[0.3em] font-bold">Men's Salon</span>
    </div>
  </motion.div>
);

const Navbar = ({ user, onLogin, onLogout }: { user: any, onLogin: () => void, onLogout: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-barber-cream/95 backdrop-blur-md shadow-xl py-3 border-b border-barber-gold/20' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          {['Home', 'About', 'Services', 'Gallery', 'Contact'].map((item, index) => (
            <motion.a 
              key={item} 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              whileHover={{ scale: 1.1, color: '#C5A059' }}
              href={`#${item.toLowerCase()}`} 
              className="text-barber-black font-display text-lg tracking-widest transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-barber-red transition-all group-hover:w-full" />
            </motion.a>
          ))}
          
          {user && user.email === "netsanjay575@gmail.com" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Link 
                to="/admin" 
                className="text-barber-red hover:text-barber-gold font-display text-lg tracking-widest transition-colors flex items-center gap-1"
              >
                <Shield size={16} />
                Dashboard
              </Link>
            </motion.div>
          )}
          
          {user ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full border border-barber-gold/30">
                <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full" />
                <span className="text-xs font-bold text-barber-black">{user.displayName.split(' ')[0]}</span>
              </div>
              <button 
                onClick={onLogout}
                className="text-barber-red hover:text-barber-gold transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </motion.div>
          ) : (
            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogin}
              className="bg-barber-black text-barber-gold px-6 py-2 rounded-full flex items-center gap-2 hover:bg-barber-red hover:text-white transition-all shadow-lg text-sm font-bold uppercase tracking-widest"
            >
              <LogIn size={18} />
              <span>Login</span>
            </motion.button>
          )}

          <motion.a 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={`https://wa.me/916380303127?text=Hi%20Kali%20Anna${user ? ',%20I\'m%20' + user.displayName : ''}`} 
            target="_blank" 
            rel="noreferrer"
            className="bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg"
          >
            <MessageCircle size={18} />
            <span className="text-sm font-bold uppercase tracking-widest">WhatsApp</span>
          </motion.a>
        </div>
      </div>
    </nav>
  );
};

const LiveNotification = () => {
  const [latestAnnouncement, setLatestAnnouncement] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const annId = snapshot.docs[0].id;
        const createdAt = data.createdAt?.toMillis() || Date.now();

        // Only show if it's a new announcement created after the session started
        if (createdAt > sessionStartTime) {
          setLatestAnnouncement({ id: annId, ...data });
          setShow(true);
          
          // Auto-hide after 10 seconds
          const timer = setTimeout(() => setShow(false), 10000);
          return () => clearTimeout(timer);
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'announcements');
    });

    return () => unsubscribe();
  }, [sessionStartTime]);

  return (
    <AnimatePresence>
      {show && latestAnnouncement && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8, transition: { duration: 0.3 } }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="fixed bottom-8 right-8 z-[100] max-w-sm w-full"
        >
          <div className="bg-barber-black text-white p-6 rounded-3xl shadow-2xl border-2 border-barber-gold/30 relative overflow-hidden group">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-barber-gold to-transparent opacity-50" 
            />
            <div className="absolute top-0 left-0 w-1 h-full bg-barber-gold" />
            <button 
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-start gap-4">
              <motion.div 
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
                className="bg-barber-gold/20 p-2 rounded-xl"
              >
                <Bell className="text-barber-gold" size={24} />
              </motion.div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-barber-gold/80 block mb-1">
                  Live Update
                </span>
                <h3 className="text-lg font-display tracking-wider text-barber-gold mb-1 leading-tight">
                  {latestAnnouncement.title}
                </h3>
                <p className="text-sm text-white/80 line-clamp-3 leading-relaxed font-sans">
                  {latestAnnouncement.content}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Just now</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AnnouncementSection = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'announcements'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds);
      setAnnouncements(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'announcements');
    });

    return () => unsubscribe();
  }, []);

  if (announcements.length === 0) return null;

  return (
    <section className="py-12 bg-barber-gold/10 border-y border-barber-gold/20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="text-barber-red" />
            <h2 className="text-4xl text-barber-black font-display tracking-wider">Latest Updates</h2>
          </div>
          <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Live Updates</span>
          </div>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((ann, index) => (
            <motion.div 
              key={ann.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-barber-gold/20 transition-all duration-300"
            >
              <h3 className="text-xl font-bold text-barber-red mb-2 font-display tracking-wide">{ann.title}</h3>
              <p className="text-barber-black/70 text-sm mb-4 leading-relaxed font-sans">{ann.content}</p>
              <p className="text-[10px] text-barber-black/40 uppercase tracking-widest font-bold">
                Posted on {ann.createdAt?.toDate().toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AdminDashboard = ({ user }: { user: any }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.email !== "netsanjay575@gmail.com") {
      navigate('/');
      return;
    }

    // Bookings listener
    const qBookings = query(collection(db, 'bookings'));
    const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds);
      setBookings(docs);
    });

    // Announcements listener
    const qAnnouncements = query(collection(db, 'announcements'));
    const unsubscribeAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds);
      setAnnouncements(docs);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeAnnouncements();
    };
  }, [user, navigate]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        ...newAnnouncement,
        authorId: user.uid,
        createdAt: serverTimestamp()
      });
      setNewAnnouncement({ title: '', content: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await setDoc(doc(db, 'bookings', id), { status }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
    }
  };

  if (!user || user.email !== "netsanjay575@gmail.com") return null;

  return (
    <div className="min-h-screen bg-barber-cream pt-24 pb-12 px-6 relative overflow-hidden">
      <div className="absolute inset-0 vintage-overlay opacity-20 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-5xl font-display text-barber-black tracking-wider">Owner Dashboard</h1>
            <p className="text-barber-black/60 font-sans">Manage your salon operations and updates.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="bg-barber-black text-barber-gold px-8 py-3 rounded-full font-display text-xl tracking-widest hover:bg-barber-red hover:text-white transition-all shadow-lg"
          >
            Back to Website
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Bookings Management */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-barber-gold/20">
              <div className="flex items-center gap-3 mb-8">
                <Calendar className="text-barber-red" />
                <h2 className="text-3xl font-display text-barber-black tracking-wider">Recent Bookings</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-barber-gold/10">
                      <th className="py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-barber-black/50">Client</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-barber-black/50">Service</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-barber-black/50">Date</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-barber-black/50">Status</th>
                      <th className="py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-barber-black/50 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-barber-gold/5">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="group hover:bg-barber-cream/50 transition-colors">
                        <td className="py-4">
                          <div className="font-bold text-barber-black font-sans">{booking.fullName}</div>
                          <div className="text-[10px] text-barber-black/40 font-bold tracking-widest uppercase">{booking.phone}</div>
                        </td>
                        <td className="py-4 text-sm text-barber-black/70 font-sans">{booking.service}</td>
                        <td className="py-4 text-sm text-barber-black/70 font-sans">{new Date(booking.date).toLocaleDateString()}</td>
                        <td className="py-4">
                          <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100"
                              title="Confirm"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button 
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                              title="Cancel"
                            >
                              <AlertCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Announcements Management */}
          <div className="space-y-8">
            <div className="bg-barber-black p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 barber-pole-border opacity-50" />
              <div className="flex items-center gap-3 mb-8">
                <Plus className="text-barber-gold" />
                <h2 className="text-3xl font-display text-barber-gold tracking-wider">Post Update</h2>
              </div>
              
              <form onSubmit={handlePostAnnouncement} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-gold/60">Title</label>
                  <input 
                    type="text"
                    required
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    className="w-full bg-white/5 border-2 border-barber-gold/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-barber-gold focus:border-transparent transition-all text-white placeholder:text-white/20 font-sans"
                    placeholder="Special Offer!"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-gold/60">Content</label>
                  <textarea 
                    required
                    rows={4}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                    className="w-full bg-white/5 border-2 border-barber-gold/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-barber-gold focus:border-transparent transition-all text-white placeholder:text-white/20 resize-none font-sans"
                    placeholder="Describe your update..."
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-barber-gold text-barber-black py-4 rounded-xl font-display text-2xl tracking-widest hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-barber-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Post to Website
                      <Send size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-barber-gold/20">
              <h3 className="text-3xl font-display text-barber-black mb-8 tracking-wider">Live Updates</h3>
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-5 bg-barber-cream/50 rounded-2xl relative group border border-barber-gold/10">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-display text-xl text-barber-red tracking-wide">{ann.title}</h4>
                      <button 
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="text-barber-red hover:text-white hover:bg-barber-red transition-all p-2 rounded-xl border border-barber-red/20"
                        title="Delete Update"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-barber-black/70 font-sans leading-relaxed line-clamp-2">{ann.content}</p>
                    <div className="mt-3 text-[10px] text-barber-black/40 uppercase tracking-widest font-bold">
                      {ann.createdAt?.toDate().toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Hero = ({ user }: { user: any }) => (
  <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
    {/* Video Background */}
    <div className="absolute inset-0 z-0">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-60 scale-105"
      >
        <source 
          src="https://player.vimeo.com/external/434045526.sd.mp4?s=c27ee348587d59f25630224403ab677656f0584d&profile_id=164&oauth2_token_id=57447761" 
          type="video/mp4" 
        />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-barber-black/80 via-barber-black/40 to-barber-cream" />
    </div>

    <div className="absolute inset-0 vintage-overlay opacity-30" />
    
    <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
      <motion.div 
        initial={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-barber-gold font-bold uppercase tracking-[0.4em] text-sm mb-4 block"
        >
          Premium Grooming Experience
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-7xl md:text-9xl text-white mb-6 leading-none font-display"
        >
          Traditional Style. <br />
          <span className="italic text-barber-gold font-serif text-5xl md:text-7xl lowercase">Modern Confidence.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="text-lg text-white/90 mb-8 max-w-md leading-relaxed font-sans"
        >
          Experience the art of grooming where heritage meets contemporary style. 
          The finest salon experience for the modern gentleman.
        </motion.p>
        <div className="flex flex-wrap gap-4">
          <motion.a 
            href="#booking" 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            whileHover={{ scale: 1.05, backgroundColor: "#B22222", color: "#FFFFFF" }}
            whileTap={{ scale: 0.95 }}
            className="bg-barber-gold text-barber-black px-10 py-4 rounded-full font-display text-xl tracking-widest transition-all shadow-2xl flex items-center gap-2 group border-2 border-transparent hover:border-barber-gold"
          >
            Book Appointment
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </motion.a>
          <motion.a 
            href={`https://wa.me/916380303127?text=Hi%20Kali%20Anna${user ? ',%20I\'m%20' + user.displayName : ''}`} 
            target="_blank" 
            rel="noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 }}
            whileHover={{ scale: 1.05, backgroundColor: "#25D366", color: "#FFFFFF", borderColor: "#25D366" }}
            whileTap={{ scale: 0.95 }}
            className="border-2 border-white/30 text-white px-10 py-4 rounded-full font-display text-xl tracking-widest transition-all shadow-lg flex items-center gap-2 backdrop-blur-sm"
          >
            <MessageCircle size={20} />
            WhatsApp
          </motion.a>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 3 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
        className="relative hidden md:block"
      >
        <div className="relative z-10 rounded-2xl overflow-hidden border-8 border-barber-gold shadow-2xl transition-transform duration-500 hover:rotate-0">
          <img 
            src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=800" 
            alt="Barber Shop" 
            className="w-full h-[600px] object-cover grayscale hover:grayscale-0 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
        </div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-10 -right-10 w-40 h-40 bg-barber-red/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-10 -left-10 w-40 h-40 bg-barber-gold/20 rounded-full blur-3xl" 
        />
      </motion.div>
    </div>
  </section>
);

const About = () => (
  <section id="about" className="py-24 bg-barber-cream relative overflow-hidden">
    <div className="absolute inset-0 vintage-overlay opacity-20 pointer-events-none" />
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="order-2 md:order-1 relative"
      >
        <div className="relative z-10">
          <motion.img 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.5 }}
            src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800" 
            alt="Ganapathi Men's Salon Interior" 
            className="rounded-2xl shadow-2xl w-full border-4 border-barber-gold/30"
            referrerPolicy="no-referrer"
          />
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute -bottom-12 -left-12 w-64 h-64 border-8 border-white rounded-2xl overflow-hidden shadow-2xl hidden lg:block z-20"
        >
          <img 
            src="https://images.unsplash.com/photo-1593702295094-ada74bc4a149?auto=format&fit=crop&q=80&w=400" 
            alt="Barber at work" 
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="absolute -bottom-6 -right-6 bg-barber-gold p-8 rounded-2xl shadow-xl hidden lg:block z-30"
        >
          <p className="text-barber-black font-display text-5xl font-bold">15+</p>
          <p className="text-barber-black/80 font-bold text-xs uppercase tracking-widest">Years of Trust</p>
        </motion.div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="order-1 md:order-2"
      >
        <span className="text-barber-red font-bold uppercase tracking-[0.4em] text-sm mb-4 block">Our Legacy</span>
        <h2 className="text-6xl text-barber-black mb-6 font-display tracking-wide">The Story of Ganapathi Men's Salon</h2>
        <p className="text-barber-black/70 mb-6 leading-relaxed font-sans">
          Founded on the principles of tradition and excellence, Ganapathi Men's Salon has been a cornerstone of grooming for over a decade. We believe that a haircut is more than just a service—it's a ritual of transformation.
        </p>
        <p className="text-barber-black/70 mb-8 leading-relaxed font-sans">
          Our master barbers combine ancient techniques with modern trends to ensure every client leaves with confidence. From the sandalwood-scented towels to the precision of our blades, every detail is crafted for your comfort.
        </p>
        <div className="grid grid-cols-2 gap-6">
          {[
            { icon: <Scissors />, title: 'Tradition', desc: 'Rooted in heritage' },
            { icon: <Sparkles />, title: 'Modernity', desc: 'Contemporary styles' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + (i * 0.2) }}
              className="flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-barber-gold/20 rounded-full flex items-center justify-center flex-shrink-0 text-barber-red shadow-sm">
                {item.icon}
              </div>
              <div>
                <h4 className="font-display text-xl text-barber-black tracking-wide">{item.title}</h4>
                <p className="text-xs text-barber-black/60 font-sans">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

const Services = ({ onBookNow }: { onBookNow: (service: string) => void }) => {
  const services = [
    { name: 'Haircut', price: '₹130', icon: <Scissors />, desc: 'Precision cutting and styling tailored to your face shape.' },
    { name: 'Beard Styling', price: '₹150', icon: <User />, desc: 'Expert shaping, trimming, and hot towel treatment.' },
    { name: 'Facial', price: '₹300', icon: <Sparkles />, desc: 'Deep cleansing and rejuvenation for a radiant look.' },
    { name: 'Hair Spa', price: '₹350', icon: <Wind />, desc: 'Nourishing treatment for healthy, strong hair.' },
    { name: 'Head Massage', price: '₹200', icon: <Hand />, desc: 'Traditional oil massage for ultimate relaxation.' },
  ];

  return (
    <section id="services" className="py-24 bg-barber-black relative overflow-hidden">
      <div className="absolute inset-0 leather-texture opacity-10 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-barber-gold font-bold uppercase tracking-[0.4em] text-sm mb-4 block">Our Expertise</span>
          <h2 className="text-6xl text-white mb-4 font-display tracking-wider">Premium Services</h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-1 bg-barber-gold mx-auto" 
          />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div 
              key={service.name}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="bg-zinc-900/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-barber-gold/20 hover:border-barber-gold/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-barber-gold/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
              
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
                className="w-16 h-16 bg-barber-red rounded-2xl flex items-center justify-center text-barber-gold mb-6 relative z-10 shadow-lg"
              >
                {service.icon}
              </motion.div>
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="text-2xl text-barber-gold font-display tracking-wide">{service.name}</h3>
                <span className="text-white font-display text-2xl">{service.price}</span>
              </div>
              <p className="text-white/60 text-sm mb-6 relative z-10 font-sans leading-relaxed">{service.desc}</p>
              <a 
                href="#booking"
                onClick={() => onBookNow(service.name)}
                className="text-barber-gold font-display text-lg tracking-widest flex items-center gap-2 hover:gap-4 transition-all relative z-10 group/btn"
              >
                Book Now <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Gallery = () => {
  const singleImage = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200";

  return (
    <section id="gallery" className="py-24 bg-barber-cream text-barber-black overflow-hidden relative">
      <div className="absolute inset-0 vintage-overlay opacity-20 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-barber-red font-bold uppercase tracking-[0.4em] text-sm mb-4 block">Our Craft</span>
          <h2 className="text-6xl text-barber-black mb-4 font-display tracking-wider">The Signature Look</h2>
          <p className="text-barber-black/60 font-sans">Experience the pinnacle of grooming excellence.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, rotateY: 20 }}
          whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative aspect-video overflow-hidden rounded-3xl group shadow-2xl border-4 border-barber-gold/20 perspective-1000"
        >
          <motion.img 
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 1.5 }}
            src={singleImage} 
            alt="Signature Style" 
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-barber-black/90 via-barber-black/20 to-transparent opacity-80" />
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute bottom-8 left-8"
          >
            <div className="flex items-center gap-4">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-12 h-12 bg-barber-red rounded-full flex items-center justify-center border-2 border-barber-gold shadow-lg"
              >
                <Scissors className="text-barber-gold" size={24} />
              </motion.div>
              <div>
                <p className="text-barber-gold font-bold uppercase tracking-widest text-xs">Master Barbering</p>
                <p className="text-white font-display text-3xl tracking-wide">Precision & Artistry</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const Booking = ({ user, onLogin, selectedService }: { user: any, onLogin: () => void, selectedService?: string }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    service: 'Haircut',
    date: ''
  });

  useEffect(() => {
    if (selectedService) {
      setFormData(prev => ({ ...prev, service: selectedService }));
    }
  }, [selectedService]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, fullName: user.displayName || '', phone: '' }));
      
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds);
        setUserBookings(bookings);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'bookings');
      });

      return () => unsubscribe();
    } else {
      setUserBookings([]);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onLogin();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'bookings'), {
        ...formData,
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setFormData({ ...formData, date: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("Booking error:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'bookings');
      } catch (finalErr: any) {
        setError(finalErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="booking" className="py-24 bg-barber-cream relative overflow-hidden">
      <div className="absolute inset-0 vintage-overlay opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-2 barber-pole-border opacity-50" />
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border-2 border-barber-gold/30 relative h-fit">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-barber-black rounded-full flex items-center justify-center border-4 border-barber-gold shadow-xl">
              <Calendar className="text-barber-gold" size={32} />
            </div>
            
            <div className="text-center mt-8 mb-12">
              <h2 className="text-5xl text-barber-black mb-2 font-display tracking-wider">Book Your Session</h2>
              <p className="text-barber-black/60 font-sans">Reserve your spot for a premium grooming experience.</p>
            </div>

            <form className="grid md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-red">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full px-6 py-4 rounded-xl border-2 border-barber-gold/20 focus:border-barber-gold outline-none transition-colors font-sans"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-red">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-6 py-4 rounded-xl border-2 border-barber-gold/20 focus:border-barber-gold outline-none transition-colors font-sans"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-red">Service</label>
                <select 
                  className="w-full px-6 py-4 rounded-xl border-2 border-barber-gold/20 focus:border-barber-gold outline-none transition-colors appearance-none bg-white font-sans"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                >
                  <option>Haircut</option>
                  <option>Beard Styling</option>
                  <option>Facial</option>
                  <option>Hair Spa</option>
                  <option>Head Massage</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-barber-red">Preferred Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-6 py-4 rounded-xl border-2 border-barber-gold/20 focus:border-barber-gold outline-none transition-colors font-sans"
                />
              </div>
              <div className="md:col-span-2 mt-4">
                <button 
                  disabled={loading}
                  className="w-full bg-barber-black text-barber-gold py-5 rounded-xl font-display text-2xl tracking-widest hover:bg-barber-red hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-barber-gold border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Confirm Appointment</span>
                      <ChevronRight size={24} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 p-4 bg-green-100 text-green-800 rounded-xl flex items-center gap-3 border border-green-200 font-sans"
                >
                  <CheckCircle2 className="text-green-600" />
                  <p className="font-medium">Booking successful! We'll contact you soon.</p>
                </motion.div>
              )}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 p-4 bg-red-100 text-red-800 rounded-xl flex items-center gap-3 border border-red-200 font-sans"
                >
                  <AlertCircle className="text-red-600" />
                  <p className="font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <Clock className="text-barber-gold" />
              <h3 className="text-4xl font-display text-barber-black tracking-wider">Your Bookings</h3>
            </div>

            {!user ? (
              <div className="bg-barber-black/5 p-12 rounded-3xl border-2 border-dashed border-barber-gold/30 text-center">
                <User className="mx-auto text-barber-black/20 mb-4" size={48} />
                <p className="text-barber-black/60 mb-6 font-sans">Login to view and manage your grooming appointments.</p>
                <button 
                  onClick={onLogin}
                  className="text-barber-red font-display text-xl tracking-widest hover:text-barber-gold transition-colors underline underline-offset-8"
                >
                  Sign in with Google
                </button>
              </div>
            ) : userBookings.length === 0 ? (
              <div className="bg-barber-black/5 p-12 rounded-3xl border-2 border-dashed border-barber-gold/30 text-center">
                <Calendar className="mx-auto text-barber-black/20 mb-4" size={48} />
                <p className="text-barber-black/60 font-sans">No bookings found. Start your grooming journey today!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {userBookings.map((booking) => (
                  <motion.div 
                    key={booking.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 rounded-2xl shadow-md border border-barber-gold/10 flex justify-between items-center group hover:border-barber-gold/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-barber-gold">{booking.service}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <h4 className="font-display text-2xl text-barber-black tracking-wide">{new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                      <p className="text-[10px] text-barber-black/40 uppercase tracking-widest font-bold">Booked on {booking.createdAt?.toDate().toLocaleDateString()}</p>
                    </div>
                    <div className="w-10 h-10 bg-barber-cream rounded-full flex items-center justify-center text-barber-red group-hover:bg-barber-red group-hover:text-white transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const reviews = [
    { 
      name: 'Mani', 
      text: 'Best salon in the city. The traditional vibe combined with modern precision is unmatched.', 
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'
    },
    { 
      name: 'Epstin', 
      text: 'Excellent service. The head massage is a must-try. Very professional staff.', 
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'
    },
    { 
      name: 'Baal', 
      text: 'Been coming here for 5 years. Trustworthy and always consistent with my style.', 
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-barber-black text-white relative overflow-hidden">
      <div className="absolute inset-0 leather-texture opacity-10 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-barber-gold font-bold uppercase tracking-[0.4em] text-sm mb-4 block">Testimonials</span>
          <h2 className="text-6xl text-barber-gold mb-4 font-display tracking-wider">What Our Clients Say</h2>
          <div className="w-24 h-1 bg-barber-gold mx-auto rounded-full" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              whileHover={{ y: -10 }}
              className="bg-zinc-900/50 p-8 rounded-3xl backdrop-blur-sm border border-barber-gold/10 relative group"
            >
              <div className="absolute top-6 right-8 text-barber-gold/10 group-hover:text-barber-gold/20 transition-colors">
                <Star size={48} className="fill-current" />
              </div>
              <div className="flex items-center gap-4 mb-6">
                <motion.img 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  src={review.avatar} 
                  alt={review.name} 
                  className="w-14 h-14 rounded-full border-2 border-barber-gold object-cover shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="font-display text-xl text-barber-gold tracking-wide">{review.name}</p>
                  <div className="flex gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                      >
                        <Star key={i} size={12} className="fill-barber-gold text-barber-gold" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="italic text-lg text-white/90 leading-relaxed font-serif">"{review.text}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Contact = ({ user }: { user: any }) => (
  <section id="contact" className="py-24 bg-barber-cream relative overflow-hidden">
    <div className="absolute inset-0 vintage-overlay opacity-20 pointer-events-none" />
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <span className="text-barber-gold font-bold uppercase tracking-[0.4em] text-sm mb-4 block">Get In Touch</span>
        <h2 className="text-6xl text-barber-black mb-8 font-display tracking-wider">Visit Us Today</h2>
        
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-6 group"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-14 h-14 bg-barber-black rounded-2xl flex items-center justify-center text-barber-gold flex-shrink-0 shadow-lg group-hover:bg-barber-red group-hover:text-white transition-colors duration-300"
            >
              <MapPin />
            </motion.div>
            <div>
              <h4 className="font-display text-2xl text-barber-black tracking-wide mb-1">Our Location</h4>
              <p className="text-barber-black/70 font-sans">Amthur Vellur,<br />Amman Kovil Patti, 626001</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-6 group"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-14 h-14 bg-barber-black rounded-2xl flex items-center justify-center text-barber-gold flex-shrink-0 shadow-lg group-hover:bg-barber-red group-hover:text-white transition-colors duration-300"
            >
              <Phone />
            </motion.div>
            <div>
              <h4 className="font-display text-2xl text-barber-black tracking-wide mb-1">Call Us</h4>
              <p className="text-barber-black/70 font-sans">+91 63803 03127<br />+91 91597 38607</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex items-start gap-6 group"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-14 h-14 bg-barber-black rounded-2xl flex items-center justify-center text-barber-gold flex-shrink-0 shadow-lg group-hover:bg-barber-red group-hover:text-white transition-colors duration-300"
            >
              <MessageCircle />
            </motion.div>
            <div>
              <h4 className="font-display text-2xl text-barber-black tracking-wide mb-1">WhatsApp</h4>
              <a 
                href={`https://wa.me/916380303127?text=Hi%20Kali%20Anna${user ? ',%20I\'m%20' + user.displayName : ''}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-barber-black/70 hover:text-barber-red transition-colors font-sans font-bold"
              >
                +91 63803 03127
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="flex items-start gap-6 group"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-14 h-14 bg-barber-black rounded-2xl flex items-center justify-center text-barber-gold flex-shrink-0 shadow-lg group-hover:bg-barber-red group-hover:text-white transition-colors duration-300"
            >
              <Clock />
            </motion.div>
            <div>
              <h4 className="font-display text-2xl text-barber-black tracking-wide mb-1">Working Hours</h4>
              <p className="text-barber-black/70 font-sans">Mon - Sat: 7:00 AM - 9:30 PM<br />Sun: 6:00 AM - 10:00 PM</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="flex items-start gap-6 group"
          >
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-14 h-14 bg-barber-black rounded-2xl flex items-center justify-center text-barber-gold flex-shrink-0 shadow-lg group-hover:bg-barber-red group-hover:text-white transition-colors duration-300"
            >
              <Sparkles />
            </motion.div>
            <div>
              <h4 className="font-display text-2xl text-barber-black tracking-wide mb-1">Follow Us</h4>
              <div className="flex gap-6 mt-2">
                <motion.a 
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  href="https://www.instagram.com/ganapathi_mens_salon?igsh=MWJ0NHM0d2VuMGhxdQ==" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-barber-red hover:text-barber-gold transition-colors flex items-center gap-2 group/social"
                >
                  <Instagram size={24} />
                  <span className="text-sm font-bold opacity-0 group-hover/social:opacity-100 transition-opacity">Instagram</span>
                </motion.a>
                <motion.a 
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  href="https://www.facebook.com/share/1CYJs9Yf3b/" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-barber-red hover:text-barber-gold transition-colors flex items-center gap-2 group/social"
                >
                  <Facebook size={24} />
                  <span className="text-sm font-bold opacity-0 group-hover/social:opacity-100 transition-opacity">Facebook</span>
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="h-[500px] rounded-3xl overflow-hidden shadow-2xl border-8 border-white relative">
        <div className="absolute inset-0 barber-pole-border opacity-10 pointer-events-none z-10" />
        <iframe 
          src="https://maps.google.com/maps?q=Ganapathi%20Mens%20Salon%20Amman%20Kovil%20Patti%20Vellur&t=&z=15&ie=UTF8&iwloc=&output=embed" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen={true} 
          loading="lazy"
          title="Ganapathi Men's Salon Location"
          className="relative z-0"
        />
      </div>
    </div>
  </section>
);

const Footer = ({ user }: { user: any }) => {
  return (
    <footer className="bg-barber-black text-white pt-16 pb-8 relative overflow-hidden">
      <div className="absolute inset-0 leather-texture opacity-10 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2"
          >
            <Logo />
            <p className="mt-6 text-white/50 max-w-sm leading-relaxed font-sans">
              Crafting confidence through traditional artistry and modern techniques. 
              The premier destination for the modern gentleman's grooming needs.
            </p>
            <div className="flex gap-4 mt-8">
              {[
                { icon: <Instagram size={20} />, href: "https://www.instagram.com/ganapathi_mens_salon?igsh=MWJ0NHM0d2VuMGhxdQ==", title: "Instagram" },
                { icon: <Facebook size={20} />, href: "https://www.facebook.com/share/1CYJs9Yf3b/", title: "Facebook" },
                { icon: <MessageCircle size={20} />, href: `https://wa.me/916380303127?text=Hi%20Kali%20Anna${user ? ',%20I\'m%20' + user.displayName : ''}`, title: "WhatsApp" }
              ].map((social, i) => (
                <motion.a 
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  whileHover={{ scale: 1.2, rotate: 5, backgroundColor: '#C5A059', color: '#1A1A1A' }}
                  href={social.href} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center transition-all border border-white/10"
                  title={social.title}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-barber-gold font-display text-2xl tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-4 text-white/60 font-sans">
              {['Home', 'About', 'Services', 'Gallery', 'Contact'].map((item, i) => (
                <motion.li 
                  key={item}
                  whileHover={{ x: 5, color: '#C5A059' }}
                >
                  <a href={`#${item.toLowerCase()}`} className="transition-colors">{item}</a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="text-barber-gold font-display text-2xl tracking-widest mb-6">Newsletter</h4>
            <p className="text-sm text-white/50 mb-6 font-sans">Subscribe for style tips and exclusive offers.</p>
            <Link 
              to="/subscribe"
              className="inline-flex items-center gap-2 bg-barber-gold text-barber-black px-8 py-3 rounded-xl font-display text-xl tracking-widest hover:bg-white transition-all shadow-lg group"
            >
              Join Now
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-white/30 text-[10px] uppercase tracking-[0.2em] font-bold"
        >
          <p>© 2026 Ganapathi Men's Salon. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

const LandingPage = ({ user, onLogin, onLogout, selectedService, setSelectedService }: any) => (
  <div className="min-h-screen">
    <Navbar user={user} onLogin={onLogin} onLogout={onLogout} />
    <LiveNotification />
    <Hero user={user} />
    <AnnouncementSection />
    <About />
    <Services onBookNow={setSelectedService} />
    <Gallery />
    <Booking user={user} onLogin={onLogin} selectedService={selectedService} />
    <Testimonials />
    <Contact user={user} />
    <Footer user={user} />
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState('Haircut');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              role: 'client',
              createdAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.error("User profile error:", err);
          // Silent fail for profile creation but log it
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-barber-cream flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 vintage-overlay opacity-20 pointer-events-none" />
        <div className="relative">
          <div className="w-20 h-20 border-4 border-barber-gold border-t-barber-red rounded-full animate-spin" />
          <Scissors className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-barber-black" size={24} />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={
            <LandingPage 
              user={user} 
              onLogin={handleLogin} 
              onLogout={handleLogout} 
              selectedService={selectedService} 
              setSelectedService={setSelectedService} 
            />
          } />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
