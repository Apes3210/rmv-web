import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  CheckCircle,
  Clock,
  Utensils,

  ShoppingBag,
  Store,
  Coffee,
  Truck,
  HeartPulse,
  Home,
  Hotel,
  MapPin,
  Phone,
  Mail,
  Quote,
  Maximize,
  Layers,
  Star,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { motion, LazyMotion, domAnimation, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// Ultra-smooth 240Hz-optimized ease — gentle acceleration, long organic deceleration
const SMOOTH_240: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface CollectionProject {
  title: string;
  location: string;
  image: string;
  description: string;
}

interface CollectionData {
  id: string;
  label: string;
  headline: string;
  shortDescription: string;
  capabilityDescription: string;
  bestFor: string;
  scopeNote: string;
  coverImage: string;
  tags: string[];
  systems: string[];
  icon: React.ElementType;
  projects: CollectionProject[];
}

interface HeroSignalCard {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
}

const HERO_SIGNAL_CARDS: HeroSignalCard[] = [
  {
    label: 'Blueprint Approvals',
    value: 'Review Online',
    detail: 'See drawings and revisions clearly before fabrication moves forward.',
    icon: CheckCircle,
  },
  {
    label: 'Payment Tracking',
    value: 'Per Milestone',
    detail: 'Check balances, due dates, and verified payments in one place.',
    icon: LayoutDashboard,
  },
  {
    label: 'Project Progress',
    value: 'Live Updates',
    detail: 'Follow fabrication, quality checks, and installation updates as your project moves.',
    icon: Clock,
  },
];

const SHOWCASE_COLLECTIONS: CollectionData[] = [
  {
    id: 'completed-works',
    label: 'Completed Works',
    headline: 'Commercial Kitchens & HVAC Systems',
    shortDescription: 'Professional stainless steel fabrication for kitchens, ductwork, and overhead ventilation systems.',
    capabilityDescription: 'Complete commercial kitchen installations featuring custom fabrication, professional-grade ductwork, and full HVAC integration for restaurants and commercial food operations.',
    bestFor: 'Restaurants, commercial kitchens, and hospitality establishments.',
    scopeNote: 'From design through installation, including stainless counters, exhaust systems, and integrated ventilation.',
    coverImage: '/landing/completed-works/cover.png',
    tags: ['Commercial Grade', 'Ventilation Ready', 'Installation Included'],
    systems: ['Stainless counters', 'Ductwork fabrication', 'Exhaust hoods', 'Ventilation integration'],
    icon: Layers,
    projects: [
      {
        title: 'Professional Exhaust & Ducting',
        location: 'Commercial Kitchen',
        image: '/landing/completed-works/cover.png',
        description: 'Comprehensive overhead ventilation and ductwork installation, featuring custom-fabricated stainless steel hoods and professional-grade air extraction systems.',
      },
      {
        title: 'Commercial Kitchen Workstations',
        location: 'Metro Manila',
        image: '/landing/completed-works/project-1.jpg',
        description: 'Complete commercial kitchen layout featuring heavy-duty stainless steel shelving, custom workstations, and integrated stove units for high-efficiency food production.',
      },
      {
        title: 'Ceiling & Ventilation Infrastructure',
        location: 'Quezon City',
        image: '/landing/completed-works/project-2.png',
        description: 'Advanced kitchen ventilation setup featuring professional-grade exhaust hoods, ceiling-integrated ductwork, and specialized air filtration systems.',
      },
      {
        title: 'Stainless Steel Kitchen Build',
        location: 'Laguna',
        image: '/landing/completed-works/project-3.png',
        description: 'Full-scale stainless steel fabrication for industrial kitchens, including custom preparation tables, wall shelving, and integrated safety equipment.',
      },
    ],
  },
  {
    id: 'food-stall-works',
    label: 'Food Stall Works',
    headline: 'Food Stalls & Retail Food Service',
    shortDescription: 'Compact, efficient stainless steel food service counters and stall systems for food courts and retail operations.',
    capabilityDescription: 'Purpose-built food stall and kiosk solutions featuring branded signage, display cases, serving counters, and storage integration for maximum functionality in minimal space.',
    bestFor: 'Food courts, shopping malls, street vendors, and small food service operations.',
    scopeNote: 'Complete stall setup including counter fabrication, branding, and customer-facing design.',
    coverImage: '/landing/food-stall-works/cover.png',
    tags: ['Retail Ready', 'Branded Design', 'Compact Layout'],
    systems: ['Service counters', 'Display cases', 'Stainless fabrication', 'Custom signage'],
    icon: Store,
    projects: [
      {
        title: 'Hungry Bik Food Stall',
        location: 'Food Court',
        image: '/landing/food-stall-works/cover.png',
        description: 'Complete branded food stall featuring vibrant signage, professional serving counter with integrated storage, and custom stainless steel food preparation areas.',
      },
      {
        title: 'Mango on the Go Kiosk',
        location: 'Shopping Mall',
        image: '/landing/food-stall-works/project-1.png',
        description: 'Vibrant branded kiosk featuring custom serving counters, integrated display areas, and stainless steel preparation surfaces for specialty beverage service.',
      },
      {
        title: 'Pamiyan\'s Burmese Food Stall',
        location: 'Food Center',
        image: '/landing/food-stall-works/project-2.png',
        description: 'Professional retail food stall featuring high-contrast branding, custom-fabricated stainless service counters, and integrated overhead lighting for maximum visibility.',
      },
      {
        title: 'Ranile\'s Best Bulaluhan',
        location: 'Retail Location',
        image: '/landing/food-stall-works/project-3.png',
        description: 'Full-service food stall setup featuring an expansive menu board system, custom stainless workstations, and integrated storage for high-volume retail environments.',
      },
    ],
  },
  {
    id: 'gasline-fire-suppression',
    label: 'Gasline & Fire Suppression',
    headline: 'Gasline, Fire Suppression & Industrial Installation',
    shortDescription: 'Expert fabrication and installation of gas systems, fire suppression equipment, and specialized industrial piping.',
    capabilityDescription: 'Complete utility infrastructure solutions including certified gasline installations, fire suppression system setup, and industrial piping fabrication for commercial and industrial facilities.',
    bestFor: 'Commercial buildings, restaurants, kitchens, and industrial facilities requiring safety systems.',
    scopeNote: 'Certified installations meeting all safety codes and regulations for gas and fire suppression systems.',
    coverImage: '/landing/gasline-fire-suppression/cover.png',
    tags: ['Safety Certified', 'Industrial Grade', 'Code Compliant'],
    systems: ['Gasline installation', 'Fire suppression setup', 'Pressure piping', 'Safety systems'],
    icon: Maximize,
    projects: [
      {
        title: 'Internal Gasline Distribution',
        location: 'Commercial Kitchen',
        image: '/landing/gasline-fire-suppression/cover.png',
        description: 'Precision-engineered internal gas distribution system featuring low-profile piping, professional surface mounting, and integrated safety shut-off controls.',
      },
      {
        title: 'Exterior Gasline Installation',
        location: 'Industrial Site',
        image: '/landing/gasline-fire-suppression/project-1.png',
        description: 'Professional-grade exterior gasline fabrication using heavy-duty piping and certified mounting systems, ensuring full compliance with safety standards.',
      },
      {
        title: 'Industrial Pressure Testing',
        location: 'Testing Phase',
        image: '/landing/gasline-fire-suppression/project-2.png',
        description: 'Rigorous pressure testing and calibration for gas and liquid distribution systems, using certified gauges to ensure system integrity and safety.',
      },
      {
        title: 'Automated Fire Suppression',
        location: 'Operational Area',
        image: '/landing/gasline-fire-suppression/project-3.png',
        description: 'Specialized fire suppression system featuring high-capacity pressure vessels, professional mounting, and integrated piping for high-risk commercial environments.',
      },
    ],
  }


];

/** Labels match on-page headings (Fabrication Collections cards, workflow, sectors). */
const FOOTER_SERVICE_LINKS: { label: string; href: string }[] = [
  ...SHOWCASE_COLLECTIONS.map((c) => ({ label: c.label, href: `#${c.id}` })),
  { label: 'Streamlined Workflow', href: '#workflow' },
  { label: 'Sectors We Serve', href: '#sectors' },
];

export function LandingPage() {
  const { user } = useAuthStore();
  const isLoggedIn = !!user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCollectionIndex, setActiveCollectionIndex] = useState<number | null>(null);
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null);
  const activeCollection = activeCollectionIndex !== null ? SHOWCASE_COLLECTIONS[activeCollectionIndex] ?? null : null;
  const activeProject = activeCollection
    ? activeCollection.projects[activeProjectIndex ?? 0] ?? activeCollection.projects[0] ?? null
    : null;

  // Sticky hero scroll tracking
  const heroWrapperRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroWrapperRef,
    offset: ['start start', 'end start'],
  });
  const heroContentY = useTransform(heroProgress, [0, 1], [0, 100]);
  const heroContentOpacity = useTransform(heroProgress, [0, 0.5, 1], [1, 0.6, 0]);
  const heroContentScale = useTransform(heroProgress, [0, 1], [1, 0.95]);
  const blueprintLeftX = useTransform(heroProgress, [0, 1], [0, -80]);
  const blueprintRightX = useTransform(heroProgress, [0, 1], [0, 80]);
  const blueprintOpacity = useTransform(heroProgress, [0, 0.5, 1], [1, 0.6, 0]);
  const heroGlowScale = useTransform(heroProgress, [0, 1], [1, 1.3]);
  const heroGlowOpacity = useTransform(heroProgress, [0, 0.7, 1], [0.45, 0.2, 0]);

  // About section anchor
  const aboutRef = useRef<HTMLDivElement>(null);

  // Workflow section parallax
  const workflowRef = useRef<HTMLDivElement>(null);

  // Section refs for scroll anchoring
  const capabilitiesRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);

  // Testimonials section parallax
  const testimonialsRef = useRef<HTMLDivElement>(null);

  const ctaRef = useRef<HTMLDivElement>(null);
  const sectorsRef = useRef<HTMLDivElement>(null);
  const purposeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!activeCollection) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveCollectionIndex(null);
        setActiveProjectIndex(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeCollection]);

  useEffect(() => {
    document.documentElement.classList.add('landing-page-scrollbar');
    document.body.classList.add('landing-page-scrollbar');
    return () => {
      document.documentElement.classList.remove('landing-page-scrollbar');
      document.body.classList.remove('landing-page-scrollbar');
    };
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-gradient-to-b from-[#0f1419] to-[#1a202a] font-sans text-white/90 selection:bg-white/20 selection:text-white">
        
        {/* Navigation */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: SMOOTH_240 }}
          className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0f1419]/80 backdrop-blur-md gpu-reveal"
        >
          <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2 group">
              <BrandLogo className="h-6 w-6 text-white transition-opacity duration-500 hover:opacity-80" />
              <span className="text-sm font-bold tracking-tight text-white">
                RMV Stainless & Steel Fabrication
              </span>
            </Link>

            <nav className="hidden lg:flex gap-7">
              {[
                { label: 'Home', href: '#hero' },
                { label: 'About', href: '#about' },
                { label: 'Projects', href: '#projects' },
                { label: 'Contact', href: '#contact' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[13px] font-medium text-white/70 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <Link to="/privacy" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors">Terms</Link>
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              {isLoggedIn ? (
                <Button asChild variant="ghost" className="h-9 rounded-md px-5 text-[13px] font-medium text-white hover:bg-white/5">
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Link to="/login" className="px-3 py-2 text-[13px] font-medium text-white/70 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Button asChild style={{ background: 'linear-gradient(135deg, #c9a96f 0%, #e2cba1 50%, #b89552 100%)' }} className="h-9 rounded-md border-none px-6 text-[13px] font-bold text-zinc-950 shadow-[0_4px_14px_rgba(201,169,111,0.2)] transition-transform hover:scale-105">
                    <Link to="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            <button
              type="button"
              className="-mr-1 rounded-md p-2.5 text-white/70 hover:text-white hover:bg-white/5 transition-colors lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </motion.header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-[#0f1419] px-6 pt-20 lg:hidden"
          >
            <nav className="flex flex-col gap-1 mt-4">
               {[
                 { label: 'Home', href: '#hero' },
                 { label: 'About', href: '#about' },
                 { label: 'Projects', href: '#projects' },
                 { label: 'Contact', href: '#contact' },
               ].map((item) => (
                 <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="border-b border-white/10 py-4 text-xl font-medium tracking-tight text-white/90 transition-colors hover:text-white">
                   {item.label}
                 </a>
               ))}
               <Link to="/privacy" onClick={() => setMobileMenuOpen(false)} className="border-b border-white/10 py-4 text-xl font-medium tracking-tight text-white/90 transition-colors hover:text-white">
                 Privacy Policy
               </Link>
               <Link to="/terms" onClick={() => setMobileMenuOpen(false)} className="border-b border-white/10 py-4 text-xl font-medium tracking-tight text-white/90 transition-colors hover:text-white">
                 Terms of Service
               </Link>
               <div className="pt-8 flex flex-col gap-4">
                 {isLoggedIn ? (
                   <Button asChild style={{ background: 'linear-gradient(135deg, #c9a96f 0%, #e2cba1 50%, #b89552 100%)' }} className="h-12 w-full rounded-md border-none text-base font-bold text-zinc-950 shadow-[0_4px_14px_rgba(201,169,111,0.2)] transition-transform hover:scale-105">
                     <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                   </Button>
                 ) : (
                   <>
                     <Button asChild style={{ background: 'linear-gradient(135deg, #c9a96f 0%, #e2cba1 50%, #b89552 100%)' }} className="h-12 w-full rounded-md border-none text-base font-bold text-zinc-950 shadow-[0_4px_14px_rgba(201,169,111,0.2)] transition-transform hover:scale-105">
                       <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                     </Button>
                     <Button asChild style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)' }} variant="outline" className="h-12 w-full rounded-md border-white/20 text-base font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-colors hover:bg-white/10">
                       <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                     </Button>
                   </>
                 )}
               </div>
            </nav>
          </motion.div>
        )}

        {/* Hero Section */}
        <section ref={heroWrapperRef} id="hero" className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#04070c_0%,#0c1219_18%,#15202c_42%,#223142_66%,#d0b070_86%,#f0dfb5_100%)] pt-20 pb-12 md:pb-16 lg:pb-20">
          {/* Subtle noise texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")' }} />
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(245,232,196,0.18)_0%,rgba(245,232,196,0)_100%)] pointer-events-none" />
          <div className="absolute inset-y-0 left-[12%] w-px bg-[linear-gradient(180deg,transparent_0%,rgba(233,194,115,0.3)_16%,rgba(233,194,115,0.08)_82%,transparent_100%)] pointer-events-none hidden xl:block" />
          <div className="absolute inset-y-0 right-[12%] w-px bg-[linear-gradient(180deg,transparent_0%,rgba(173,194,217,0.26)_16%,rgba(173,194,217,0.08)_82%,transparent_100%)] pointer-events-none hidden xl:block" />
          {/* Soft center glow — parallax layer */}
          <motion.div
            style={{ scale: heroGlowScale, opacity: heroGlowOpacity }}
            className="absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(241,212,154,0.24)_0%,rgba(125,150,181,0.16)_28%,transparent_62%)] pointer-events-none will-change-transform md:h-[1100px] md:w-[1100px]"
          />

          {/* Left Blueprint SVG Decoration */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.6, delay: 0.3, ease: SMOOTH_240 }}
            style={{ x: blueprintLeftX, opacity: blueprintOpacity }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[220px] md:w-[340px] lg:w-[420px] pointer-events-none hidden sm:block"
          >
            <svg viewBox="0 0 420 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto opacity-[0.10]">
              {/* Flange / circular mechanical part */}
              <circle cx="210" cy="260" r="160" stroke="#5a5a60" strokeWidth="1.5" />
              <circle cx="210" cy="260" r="130" stroke="#5a5a60" strokeWidth="1" />
              <circle cx="210" cy="260" r="80" stroke="#5a5a60" strokeWidth="1.5" />
              <circle cx="210" cy="260" r="45" stroke="#5a5a60" strokeWidth="1" />
              <circle cx="210" cy="260" r="20" stroke="#5a5a60" strokeWidth="2" fill="#5a5a60" fillOpacity="0.08" />
              {/* Bolt holes */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const cx = 210 + 108 * Math.cos(rad);
                const cy = 260 + 108 * Math.sin(rad);
                return <circle key={angle} cx={cx} cy={cy} r="8" stroke="#5a5a60" strokeWidth="1" />;
              })}
              {/* Cross-hair lines */}
              <line x1="20" y1="260" x2="400" y2="260" stroke="#5a5a60" strokeWidth="0.5" strokeDasharray="6 4" />
              <line x1="210" y1="70" x2="210" y2="450" stroke="#5a5a60" strokeWidth="0.5" strokeDasharray="6 4" />
              {/* Dimension lines */}
              <line x1="50" y1="440" x2="370" y2="440" stroke="#5a5a60" strokeWidth="0.8" />
              <line x1="50" y1="435" x2="50" y2="445" stroke="#5a5a60" strokeWidth="0.8" />
              <line x1="370" y1="435" x2="370" y2="445" stroke="#5a5a60" strokeWidth="0.8" />
              <text x="210" y="458" textAnchor="middle" fill="#5a5a60" fontSize="10" fontFamily="monospace">Ø 320mm</text>
              {/* Detail callout */}
              <line x1="330" y1="160" x2="390" y2="100" stroke="#5a5a60" strokeWidth="0.7" />
              <circle cx="330" cy="160" r="3" fill="#5a5a60" />
              <text x="392" y="104" fill="#5a5a60" fontSize="8" fontFamily="monospace">DETAIL A</text>
              {/* Section indicator */}
              <rect x="40" y="510" width="340" height="60" rx="2" stroke="#5a5a60" strokeWidth="0.8" fill="none" />
              <line x1="40" y1="540" x2="380" y2="540" stroke="#5a5a60" strokeWidth="0.5" strokeDasharray="4 3" />
              <text x="210" y="530" textAnchor="middle" fill="#5a5a60" fontSize="9" fontFamily="monospace">SECTION A-A</text>
              <text x="210" y="560" textAnchor="middle" fill="#5a5a60" fontSize="8" fontFamily="monospace">SCALE 1:2</text>
            </svg>
          </motion.div>

          {/* Right Blueprint SVG Decoration */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.6, delay: 0.3, ease: SMOOTH_240 }}
            style={{ x: blueprintRightX, opacity: blueprintOpacity }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[220px] md:w-[340px] lg:w-[420px] pointer-events-none hidden sm:block"
          >
            <svg viewBox="0 0 420 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto opacity-[0.10]">
              {/* T-pipe / cross-section */}
              <rect x="120" y="100" width="180" height="280" rx="3" stroke="#5a5a60" strokeWidth="1.5" fill="none" />
              <rect x="140" y="120" width="140" height="240" rx="2" stroke="#5a5a60" strokeWidth="0.8" fill="none" />
              {/* Internal pipe cross-section */}
              <circle cx="210" cy="240" r="55" stroke="#5a5a60" strokeWidth="1.5" />
              <circle cx="210" cy="240" r="40" stroke="#5a5a60" strokeWidth="0.8" />
              {/* Weld indicators */}
              <path d="M155 140 L165 150 L155 160" stroke="#5a5a60" strokeWidth="0.8" fill="none" />
              <path d="M265 140 L255 150 L265 160" stroke="#5a5a60" strokeWidth="0.8" fill="none" />
              {/* Dimension annotations */}
              <line x1="100" y1="100" x2="100" y2="380" stroke="#5a5a60" strokeWidth="0.7" />
              <line x1="95" y1="100" x2="105" y2="100" stroke="#5a5a60" strokeWidth="0.7" />
              <line x1="95" y1="380" x2="105" y2="380" stroke="#5a5a60" strokeWidth="0.7" />
              <text x="90" y="244" textAnchor="middle" fill="#5a5a60" fontSize="9" fontFamily="monospace" transform="rotate(-90 90 244)">280mm</text>
              <line x1="120" y1="400" x2="300" y2="400" stroke="#5a5a60" strokeWidth="0.7" />
              <line x1="120" y1="395" x2="120" y2="405" stroke="#5a5a60" strokeWidth="0.7" />
              <line x1="300" y1="395" x2="300" y2="405" stroke="#5a5a60" strokeWidth="0.7" />
              <text x="210" y="418" textAnchor="middle" fill="#5a5a60" fontSize="9" fontFamily="monospace">180mm</text>
              {/* Surface finish symbol */}
              <path d="M320 300 L330 290 L340 300 L350 290" stroke="#5a5a60" strokeWidth="0.8" fill="none" />
              <text x="338" y="280" fill="#5a5a60" fontSize="8" fontFamily="monospace">Ra 1.6</text>
              {/* Title block */}
              <rect x="60" y="460" width="300" height="100" rx="2" stroke="#5a5a60" strokeWidth="1" fill="none" />
              <line x1="60" y1="485" x2="360" y2="485" stroke="#5a5a60" strokeWidth="0.5" />
              <line x1="60" y1="510" x2="360" y2="510" stroke="#5a5a60" strokeWidth="0.5" />
              <line x1="60" y1="535" x2="360" y2="535" stroke="#5a5a60" strokeWidth="0.5" />
              <line x1="210" y1="460" x2="210" y2="560" stroke="#5a5a60" strokeWidth="0.5" />
              <text x="135" y="478" textAnchor="middle" fill="#5a5a60" fontSize="8" fontFamily="monospace">MATERIAL</text>
              <text x="285" y="478" textAnchor="middle" fill="#5a5a60" fontSize="8" fontFamily="monospace">FINISH</text>
              <text x="135" y="502" textAnchor="middle" fill="#5a5a60" fontSize="9" fontFamily="monospace">SS 304</text>
              <text x="285" y="502" textAnchor="middle" fill="#5a5a60" fontSize="9" fontFamily="monospace">#4 Brushed</text>
              <text x="135" y="528" textAnchor="middle" fill="#5a5a60" fontSize="8" fontFamily="monospace">TOLERANCE</text>
              <text x="285" y="528" textAnchor="middle" fill="#5a5a60" fontSize="8" fontFamily="monospace">DRAWN BY</text>
              <text x="135" y="552" textAnchor="middle" fill="#5a5a60" fontSize="9" fontFamily="monospace">±0.5mm</text>
              <text x="285" y="552" textAnchor="middle" fill="#5a5a60" fontSize="9" fontFamily="monospace">RMV ENG.</text>
              {/* Corner triangle detail */}
              <path d="M340 120 L380 120 L380 160" stroke="#5a5a60" strokeWidth="0.6" fill="none" />
              <text x="385" y="142" fill="#5a5a60" fontSize="7" fontFamily="monospace">45°</text>
            </svg>
          </motion.div>

          {/* Bottom edge highlight */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#a0a0a6] to-transparent" />
          
          <motion.div
            style={{ y: heroContentY, opacity: heroContentOpacity, scale: heroContentScale }}
            className="relative z-10 mx-auto flex w-full max-w-[100vw] sm:max-w-5xl flex-col items-center px-4 text-center will-change-transform sm:px-6 md:mt-0"
          >
            <motion.h1
              initial={{ opacity: 0, y: 80, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.4, ease: SMOOTH_240 }}
              className="mb-4 py-2 text-center text-[12.5vw] min-[400px]:text-[56px] sm:text-[64px] md:text-[88px] lg:text-[104px] font-bold leading-[1.05] tracking-tight sm:max-w-4xl gpu-reveal"
            >
              <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent drop-shadow-sm">Precision</span><br />
              <span className="bg-gradient-to-r from-[#c9a96f] via-[#f3e0b8] to-[#ab8438] bg-clip-text text-transparent drop-shadow-sm">Engineering.</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.25, ease: SMOOTH_240 }}
              className="mb-3 max-w-2xl px-2 text-[18px] md:text-[22px] font-medium tracking-normal text-white/90 gpu-reveal"
            >
              Uncompromising quality in every weld.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.35, ease: SMOOTH_240 }}
              className="mb-8 max-w-xl px-4 text-[15px] md:text-[16px] font-normal text-white/70 gpu-reveal"
            >
              Manage your fabrication project with clearer approvals, payment tracking, and progress updates from start to finish.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: SMOOTH_240 }}
              className="flex w-full flex-col gap-4 overflow-visible pb-3 gpu-reveal sm:w-auto sm:flex-row md:pb-4"
            >
              <Button asChild style={{ background: 'linear-gradient(135deg, #c9a96f 0%, #e2cba1 50%, #b89552 100%)' }} className="group relative h-14 w-full overflow-hidden rounded-md px-8 text-[15px] font-bold text-zinc-950 shadow-[0_4px_24px_rgba(201,169,111,0.25)] transition-transform hover:scale-105 active:scale-95 border-none sm:w-auto md:h-14 md:px-10">
                <Link to="/register">
                  <span className="relative z-10 flex items-center">
                    Commission a Project
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>
              <Button asChild style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)' }} className="h-14 w-full rounded-md border border-white/20 px-8 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-colors hover:bg-white/10 active:scale-95 sm:w-auto md:h-14 md:px-10">
                <a href="#capabilities">Explore Services</a>
              </Button>
            </motion.div>

          </motion.div>

          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(20,26,34,0)_0%,rgba(20,26,34,0.3)_100%)] pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 h-px w-[min(82vw,76rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#f0d7a1]/70 to-transparent" />
        </section>

        <section className="relative border-t border-white/10 bg-[#0f1419] py-24 md:py-32">
          
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16 text-center md:mb-24"
            >
              <div className="mb-6 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a96f]/30 bg-[#c9a96f]/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-[#c9a96f] uppercase">
                  <Sparkles className="h-3.5 w-3.5" />
                  Client Portal
                </div>
              </div>
              <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-5xl">
                Stay informed from drawing approval to final installation.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
                The RMV client portal helps you review drawings, track payments, and follow project progress without relying on scattered messages or manual follow-ups.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid gap-6 lg:grid-cols-[1fr,1.5fr]"
            >
              <div className="flex flex-col justify-between rounded-2xl border border-white/20 bg-white/5 p-8 md:p-10">
                <div>
                  <h3 className="mb-4 text-2xl font-bold tracking-tight text-white">
                    A clearer project experience for every client.
                  </h3>
                  <p className="leading-relaxed text-white/60">
                    Instead of chasing updates manually, clients can review drawings, confirm payments, and monitor progress through each stage of the job.
                  </p>
                </div>
                
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/40">Faster Decisions</p>
                    <p className="mt-2 text-sm font-medium text-white">Review drawings without back-and-forth</p>
                  </div>
                  <div className="rounded-xl border border-[#c9a96f]/20 bg-[#c9a96f]/5 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#c9a96f]">Clear Visibility</p>
                    <p className="mt-2 text-sm font-medium text-white">See payments and progress in one place</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {HERO_SIGNAL_CARDS.map((card, index) => (
                  <div
                    key={card.label}
                    className={`group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04] ${index === 2 ? 'sm:col-span-2' : ''}`}
                  >
                    <div className="mb-8 flex items-start justify-between gap-4">
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">{card.label}</p>
                        <p className="text-2xl font-bold tracking-tight text-white">{card.value}</p>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-[#c9a96f]">
                        <card.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-white/50">{card.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Built on Trust Section */}
        <section ref={aboutRef} id="about" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fdfbf7 50%, #f7f1e1 100%)' }} className="relative z-10 -mt-10 overflow-hidden rounded-t-[40px] border-t border-[#e2cba1]/30 pt-24 pb-16 shadow-[0_-20px_40px_rgba(0,0,0,0.4)] md:-mt-16 md:rounded-t-[80px] md:pt-40 md:pb-32">
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid items-center gap-10 md:gap-16 lg:grid-cols-2">
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-zinc-100 px-4 py-1.5 text-xs font-semibold tracking-widest text-zinc-600 uppercase">
                  Our Story
                </div>
                <h2 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
                  Built on Trust,<br className="hidden sm:block"/> Delivered with Precision.
                </h2>
                <p className="mb-8 max-w-lg text-lg leading-relaxed text-zinc-600">
                  Founded in October 2018, RMV Stainless Steel Fabrication has grown into a trusted name in commercial kitchen fabrication. We combine traditional craftsmanship with modern technology to deliver outstanding results.
                </p>
                
                <ul className="space-y-5">
                  {[
                    'Real-time project tracking through your online portal',
                    'Transparent pricing with detailed cost breakdowns',
                    'Quality-assured with rigorous inspection protocols',
                    'Professional installation by certified technicians',
                    'On-time delivery with milestone-based updates'
                  ].map((text, i) => (
                     <li key={i} className="flex items-start gap-4">
                       <div className="mt-1 flex shrink-0 h-6 w-6 items-center justify-center rounded-full border border-[#c9a96f]/40 bg-[#c9a96f]/10">
                         <CheckCircle className="h-3.5 w-3.5 text-[#c9a96f]" />
                       </div>
                       <span className="font-medium text-zinc-800">{text}</span>
                     </li>
                  ))}
                </ul>
              </motion.div>

              <div className="relative mx-auto w-full max-w-[620px]">
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-2 md:p-3 shadow-xl shadow-zinc-200/50">
                  <div className="relative overflow-hidden rounded-xl bg-zinc-900">
                    <img
                      src="/image.png"
                      alt="RMV stainless fabrication showcase"
                      className="relative block h-auto w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Streamlined Workflow */}
        <section ref={workflowRef} id="workflow" style={{ background: 'linear-gradient(180deg, #f7f1e1 0%, #fdfbf7 50%, #ffffff 100%)' }} className="relative scroll-mt-24 border-t border-[#e2cba1]/30 py-24 md:py-32 md:scroll-mt-28">
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-10 md:gap-16 lg:grid-cols-3">
              
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="sticky top-32"
                >
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-zinc-200/50 px-4 py-1.5 text-xs font-semibold tracking-widest text-zinc-600 uppercase">
                    <Clock className="h-3.5 w-3.5" />
                    How It Works
                  </div>
                  <h2 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
                    Streamlined<br />Workflow.
                  </h2>
                  <p className="mb-10 max-w-md text-lg leading-relaxed text-zinc-600">
                    From initial consultation to final delivery — complete transparency at every step of your fabrication journey.
                  </p>
                  <Button asChild style={{ background: 'linear-gradient(135deg, #c9a96f 0%, #e2cba1 50%, #b89552 100%)' }} className="group relative h-12 overflow-hidden rounded-md px-8 text-[15px] font-bold text-zinc-950 shadow-[0_4px_20px_rgba(201,169,111,0.25)] transition-transform hover:scale-105 active:scale-95 border-none">
                    <Link to="/register">
                      <span className="relative z-10 flex items-center">
                        Get Started Now
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </Button>
                </motion.div>
              </div>

              <div className="space-y-6 lg:col-span-2">
                {[
                  { step: "01", title: "Consultation", desc: "Book online. We visit for measurements or meet to discuss your vision." },
                  { step: "02", title: "Design & Costing", desc: "Receive CAD blueprints and transparent cost breakdowns for approval." },
                  { step: "03", title: "Fabrication", desc: "Watch your project come to life with real-time progress updates." },
                  { step: "04", title: "Delivery", desc: "Professional installation with final quality check and handover." }
                ].map((item, idx) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 * idx }}
                  >
                    <div className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/40 md:flex-row md:gap-8">
                      <div className="shrink-0">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-xl font-bold text-zinc-400">
                          {item.step}
                        </div>
                      </div>
                      <div>
                        <h3 className="mb-2 text-xl font-bold tracking-tight text-zinc-900">{item.title}</h3>
                        <p className="leading-relaxed text-zinc-600">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Fabrication Collections */}
        <section ref={capabilitiesRef} id="capabilities" className="relative scroll-mt-24 border-t border-white/10 bg-[#12181f] py-24 md:py-32 md:scroll-mt-28">
          <div ref={projectsRef} id="projects" className="absolute inset-x-0 top-20 h-px" />
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16 text-center md:mb-24"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a96f]/30 bg-[#c9a96f]/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-[#c9a96f] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Collections
              </div>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                Fabrication Collections
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/60">
                Explore our portfolio of premium installations. Each track represents a different sector and scale of our manufacturing capabilities.
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SHOWCASE_COLLECTIONS.map((collection, index) => {
                const isActiveCollection = index === activeCollectionIndex;

                return (
                  <div
                    key={collection.id}
                    id={collection.id}
                    className="scroll-mt-24 md:scroll-mt-28"
                  >
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      onClick={() => {
                        setActiveCollectionIndex(index);
                        setActiveProjectIndex(0);
                      }}
                      className={`group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border text-left transition-all ${isActiveCollection ? 'border-[#c9a96f] ring-1 ring-[#c9a96f]/50' : 'border-white/10 hover:-translate-y-1 hover:border-white/30'}`}
                    >
                      <img src={collection.coverImage} alt={collection.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419]/90 via-[#0f1419]/20 to-transparent" />

                      <div className="absolute bottom-6 left-6 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                        {collection.label}
                      </div>
                      <div className={`absolute right-6 top-6 rounded-full border border-white/20 bg-black/40 p-2 text-white backdrop-blur-md transition-transform duration-300 ${isActiveCollection ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <AnimatePresence initial={false}>
          {activeCollection && activeProject && (
            <motion.div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setActiveCollectionIndex(null);
                setActiveProjectIndex(null);
              }}
            >
              <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={(event) => event.stopPropagation()}
                className="relative z-10 flex max-h-[96vh] w-full max-w-[72rem] lg:max-w-[80rem] flex-col overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-[#0f1419] shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveCollectionIndex(null);
                    setActiveProjectIndex(null);
                  }}
                  className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/80"
                  aria-label="Close image preview"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="relative w-full bg-[#0f1419]">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeProject.image}
                      src={activeProject.image}
                      alt={activeProject.title}
                      className="w-full h-auto max-h-[85vh] object-cover block"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </AnimatePresence>
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0f1419] to-transparent pointer-events-none" />
                  <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    {activeCollection.label}
                  </div>
                </div>

                <div className="flex flex-col bg-[#0f1419] p-6 lg:p-8">
                  <div className="mb-6 border-b border-white/10 pb-6">
                    <h3 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">{activeProject.title}</h3>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#c9a96f]">
                      <MapPin className="h-4 w-4" />
                      {activeProject.location}
                    </p>
                    <p className="mt-4 max-w-4xl text-base leading-relaxed text-white/70">
                      {activeProject.description}
                    </p>
                  </div>

                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/40">Gallery</p>
                    </div>
                    <div className="grid auto-cols-[80%] grid-flow-col gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:auto-cols-[40%] lg:auto-cols-[25%]">
                      {activeCollection.projects.map((project, index) => {
                        const isSelected = activeProjectIndex === index;

                        return (
                          <button
                            key={`${activeCollection.id}-${project.title}`}
                            type="button"
                            onClick={() => setActiveProjectIndex(index)}
                            className={`group relative snap-start overflow-hidden rounded-xl border text-left transition-all ${isSelected ? 'border-[#c9a96f] ring-1 ring-[#c9a96f]/50' : 'border-white/10 hover:border-white/30'}`}
                          >
                            <div className="relative aspect-video w-full overflow-hidden">
                              <img src={project.image} alt={project.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className={`absolute inset-0 transition-opacity ${isSelected ? 'bg-black/20' : 'bg-black/60 group-hover:bg-black/40'}`} />
                              <div className="absolute inset-x-0 bottom-0 p-3">
                                <div className="flex items-end justify-between gap-2">
                                  <p className="line-clamp-1 text-xs font-medium text-white">{project.title}</p>
                                  <span className={`h-2 w-2 shrink-0 rounded-full transition-colors ${isSelected ? 'bg-[#c9a96f]' : 'bg-white/30'}`} />
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sectors We Serve */}
        <section ref={sectorsRef} id="sectors" className="relative scroll-mt-24 border-t border-white/10 bg-[#0f1419] py-24 md:py-32 md:scroll-mt-28">
          
          <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">Sectors We Serve</h2>
              <p className="text-lg text-white/60">Trusted by businesses across diverse industries in the food and hospitality sector.</p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: Utensils, label: "Restaurants" },
                { icon: ShoppingBag, label: "Shopping Malls" },
                { icon: Store, label: "Food Courts" },
                { icon: Coffee, label: "Bakeries & Cafés" },
                { icon: Truck, label: "Fast Food Outlets" },
                { icon: HeartPulse, label: "Hospital Food Outlets" },
                { icon: Home, label: "Residentials" },
                { icon: Hotel, label: "Hotels & Resorts F&B" },
              ].map((sector, i) => (
                <motion.div
                  key={sector.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.05 * i }}
                  className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/[0.07] md:p-8"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c9a96f]/10 text-[#c9a96f] transition-transform group-hover:scale-110">
                    <sector.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold tracking-tight text-white">{sector.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section ref={testimonialsRef} id="testimonials" style={{ background: 'radial-gradient(ellipse at 50% -20%, #fdfbf7 0%, #ffffff 50%)' }} className="relative border-t border-[#e2cba1]/30 py-24 md:py-32">
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16 md:mb-24"
            >
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl mb-4">What Our Clients Say</h2>
              <p className="text-lg text-zinc-600">Hear from business owners who trust RMV for their fabrication needs.</p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {[
                { 
                  text: "RMV delivered our complete kitchen setup ahead of schedule. The stainless steel work is top quality and the team was very professional throughout the entire process.",
                  author: "Restaurant Owner",
                  biz: "Korean Restaurant, Quezon City"
                },
                { 
                  text: "From planning to installation, everything was handled seamlessly. The kitchen layout they designed improved our workflow significantly. Highly recommended!",
                  author: "Hotel Manager",
                  biz: "Hotel F&B, Albay"
                },
                { 
                  text: "We had multiple stalls fabricated by RMV and every single one was done with excellent craftsmanship. Affordable pricing and on-time delivery.",
                  author: "Food Court Operator",
                  biz: "Food Stalls, Fairview Terraces"
                }
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1 * i }}
                  className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/40"
                >
                  <div>
                    <Quote className="mb-6 h-8 w-8 fill-[#c9a96f] text-[#c9a96f] opacity-50" />
                    <p className="mb-8 leading-relaxed text-zinc-700">"{testimonial.text}"</p>
                  </div>
                  <div>
                    <div className="mb-4 flex gap-1">
                      {[1,2,3,4,5].map(star => <Star key={star} className="h-4 w-4 fill-[#c9a96f] text-[#c9a96f]" />)}
                    </div>
                    <p className="font-semibold text-zinc-900 tracking-tight">{testimonial.author}</p>
                    <p className="text-sm text-zinc-500">{testimonial.biz}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Purpose */}
        <section ref={purposeRef} style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fdfbf7 50%, #f7f1e1 100%)' }} className="relative border-t border-[#e2cba1]/30 py-24 md:py-32">
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4 sm:text-4xl md:text-5xl">Our Purpose</h2>
              <p className="text-lg text-zinc-600">What drives us every day in the workshop and on-site.</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/40 md:p-10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c9a96f]/10 text-[#c9a96f]">
                    <Star className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-zinc-900">Our Mission</h3>
                </div>
                <p className="text-zinc-600 leading-relaxed text-lg">
                  We are committed to delivering quality manufacturing services to our customers, fostering an environment of continuous growth for both our customers and investors.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/40 md:p-10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c9a96f]/10 text-[#c9a96f]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-zinc-900">Our Vision</h3>
                </div>
                <p className="text-zinc-600 leading-relaxed text-lg">
                  Aspiring to be a world-class manufacturer, we aim to produce quality, custom, precision parts and fabrications that surpass customer expectations. Our success lies in providing on-time or early deliveries, affordable prices, and innovative ideas.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section ref={ctaRef} className="relative border-t border-white/10 bg-[#12181f] py-24 md:py-32">
          
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-6xl">Start your build.</h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60 md:text-xl">Access the portal to manage quotes, track projects, and communicate directly with the workshop.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild style={{ background: 'linear-gradient(135deg, #c9a96f 0%, #e2cba1 50%, #b89552 100%)' }} className="group relative h-14 overflow-hidden rounded-md px-8 text-base font-bold text-zinc-950 shadow-[0_4px_24px_rgba(201,169,111,0.25)] transition-transform hover:scale-105 active:scale-95 md:px-10 border-none">
                  <Link to="/register">
                    <span className="relative z-10">Create Account</span>
                  </Link>
                </Button>
                <Button asChild style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)' }} className="h-14 rounded-md border border-white/20 px-8 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-colors hover:bg-white/10 active:scale-95 md:px-10">
                  <a href="mailto:rmvstainless@gmail.com">Contact Sales</a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Global Footer based on exact details */}
        <footer id="contact" className="relative border-t border-white/10 bg-[#0f1419] py-16 text-white md:pb-12 md:pt-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-12 grid grid-cols-2 gap-8 md:mb-16 md:grid-cols-4 md:gap-12">
              
              <div className="col-span-2 space-y-6 md:col-span-1">
                <div className="flex items-center gap-2">
                  <BrandLogo className="h-7 w-7 text-white md:h-8 md:w-8" />
                  <span className="text-base font-bold tracking-tight text-white md:text-lg">RMV Stainless Steel Fabrication</span>
                </div>
                <p className="pr-4 text-sm leading-relaxed text-white/60">
                  Precision stainless steel fabrication for residential and commercial industries.<br/>
                  Quality you can trust.
                </p>
              </div>

              <div>
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c9a96f] md:mb-6">Services</h4>
                <ul className="space-y-4">
                  {FOOTER_SERVICE_LINKS.map(({ label, href }) => (
                    <li key={label}>
                      <a href={href} className="text-sm font-medium text-white/60 transition-colors hover:text-white">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c9a96f] md:mb-6">Company</h4>
                <ul className="space-y-4">
                  <li><button type="button" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer text-sm font-medium text-white/60 transition-colors hover:text-white">About Us</button></li>
                  <li><button type="button" onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer text-sm font-medium text-white/60 transition-colors hover:text-white">Projects</button></li>
                  <li><button type="button" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer text-sm font-medium text-white/60 transition-colors hover:text-white">Contact</button></li>
                  <li><Link to="/privacy" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Terms of Service</Link></li>
                </ul>
              </div>

              <div className="col-span-2 md:col-span-1">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c9a96f] md:mb-6">Contact</h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-white/60">
                    <MapPin className="h-5 w-5 shrink-0 text-[#c9a96f]" />
                    <span className="text-sm font-medium">BIR Village, Novaliches, Quezon City, Philippines 1118</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/60">
                    <Phone className="h-5 w-5 shrink-0 text-[#c9a96f]" />
                    <span className="text-sm font-medium">02-9506187<br/>0945 285 2974</span>
                  </li>
                  <li className="flex items-center gap-3 text-white/60">
                    <Mail className="h-5 w-5 shrink-0 text-[#c9a96f]" />
                    <span className="text-sm font-medium">rmvstainless@gmail.com</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Interactive Google Map */}
            <div className="mb-10 h-[250px] w-full overflow-hidden rounded-2xl border border-white/10 md:mb-12 md:h-[300px]">
              <iframe
                title="RMV Stainless Steel Fabrication Location"
                src="https://maps.google.com/maps?q=Natanawan+Residence,+Dahlia+Ext,+Quezon+City,+Metro+Manila&z=17&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale transition-all duration-700 hover:grayscale-0"
              />
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
              <p className="text-sm font-medium text-white/60">
                &copy; {new Date().getFullYear()} RMV Stainless Steel Fabrication. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-sm font-medium">
                  <Link to="/privacy" className="text-white/60 transition-colors hover:text-white">Privacy Policy</Link>
                  <Link to="/terms" className="text-white/60 transition-colors hover:text-white">Terms of Service</Link>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-white/60">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  All Systems Operational
                </div>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </LazyMotion>
  );
}


