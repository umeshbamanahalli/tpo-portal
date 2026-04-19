import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, ShieldCheck, ArrowRight, CheckCircle, Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle Window Resize for Responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    // Auth Check
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      const routes = {
        admin: "/admin-dashboard",
        company: "/company-dashboard",
        student: "/student-dashboard"
      };
      navigate(routes[role] || "/student-dashboard");
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const features = [
    { title: "Students", desc: "Track drives & career growth", icon: <GraduationCap size={24} />, color: "#3b82f6" },
    { title: "Recruiters", desc: "Manage campus hiring cycles", icon: <Building2 size={24} />, color: "#10b981" },
    { title: "TPO Admins", desc: "Real-time placement analytics", icon: <ShieldCheck size={24} />, color: "#8b5cf6" }
  ];

  return (
    <div style={s.container}>
      {/* Background Blobs */}
      <div style={s.blob1}></div>
      <div style={s.blob2}></div>

      {/* Navbar */}
      <nav style={{ ...s.navbar, padding: isMobile ? '20px' : '24px 80px' }}>
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={s.logo}>
          PlaceNext<span style={{ color: '#0f172a' }}>DMS</span>
        </motion.h1>

        {isMobile ? (
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={s.menuBtn}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        ) : (
          <div style={s.navLinks}>
            <button onClick={() => navigate('/login')} style={s.secondaryBtn}>Sign In</button>
            <button onClick={() => navigate('/register')} style={s.primaryBtn}>Get Started</button>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobile && isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            style={s.mobileMenu}
          >
            <button onClick={() => navigate('/login')} style={s.mobileMenuLink}>Sign In</button>
            <button onClick={() => navigate('/register')} style={s.primaryBtn}>Get Started</button>
          </motion.div>
        )}
      </AnimatePresence>

      <main style={s.main}>
        <header style={{ ...s.hero, padding: isMobile ? '40px 20px' : '80px 20px 100px' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            style={s.badge}
          >
            <span style={s.pulse}></span>
            <Sparkles size={14} style={{ marginRight: 5 }} />
            {isMobile ? "2026 Season Live" : "2026 Placement Season is Live"}
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            style={{ ...s.heroTitle, fontSize: isMobile ? '42px' : '72px' }}
          >
            The Future of <br />
            <span style={s.gradientText}>Campus Recruitment.</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            style={s.heroSubtitle}
          >
            A high-performance ecosystem connecting elite talent with global industry leaders. 
            Automated, intelligent, and built for scale.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.3 }}
            style={s.ctaGroup}
          >
            <button onClick={() => navigate('/login')} style={{ ...s.mainCta, width: isMobile ? '100%' : 'auto' }}>
              Enter Workspace <ArrowRight size={20} style={{ marginLeft: '12px' }} />
            </button>
          </motion.div>
        </header>

        <section style={{ 
          ...s.featureGrid, 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))' 
        }}>
          {features.map((f, i) => (
            <motion.div 
              whileHover={{ y: -10 }}
              key={i} 
              style={s.featureCard}
            >
              <div style={{ ...s.smallIcon, backgroundColor: f.color + '15', color: f.color }}>
                {f.icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <h4 style={s.fTitle}>{f.title}</h4>
                <p style={s.fDesc}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </section>
      </main>

      <div style={{ ...s.trustBar, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '20px' : '50px' }}>
        {['Verified Recruiters', 'AI Resume Parsing', 'Smart Analytics'].map((text, idx) => (
          <div key={idx} style={s.trustItem}>
            <CheckCircle size={18} color="#10b981" /> {text}
          </div>
        ))}
      </div>

      <footer style={s.footer}>
        <p>© 2026 PlaceNext • Shivaji University Digital Initiative</p>
      </footer>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", sans-serif', color: '#1e293b', position: 'relative', overflowX: 'hidden' },
  blob1: { position: 'absolute', top: '-15%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(40px)', zIndex: 0 },
  blob2: { position: 'absolute', bottom: '5%', right: '-10%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(40px)', zIndex: 0 },
  
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 100 },
  logo: { fontSize: '28px', fontWeight: '800', color: '#3b82f6', letterSpacing: '-1px' },
  navLinks: { display: 'flex', gap: '15px' },
  menuBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#1e293b' },
  
  mobileMenu: { position: 'absolute', top: '70px', left: 0, right: 0, backgroundColor: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 99, borderBottom: '1px solid #e2e8f0' },
  mobileMenuLink: { padding: '12px', textAlign: 'center', fontWeight: '600', color: '#475569', background: 'none', border: 'none' },

  primaryBtn: { backgroundColor: '#0f172a', color: '#fff', padding: '12px 24px', borderRadius: '50px', border: 'none', fontWeight: '600', cursor: 'pointer' },
  secondaryBtn: { backgroundColor: 'transparent', color: '#475569', padding: '12px 24px', fontWeight: '600', cursor: 'pointer', border: 'none' },
  
  main: { maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 },
  hero: { textAlign: 'center' },
  badge: { display: 'inline-flex', alignItems: 'center', backgroundColor: '#fff', color: '#475569', padding: '10px 20px', borderRadius: '50px', fontSize: '14px', fontWeight: '600', marginBottom: '40px', border: '1px solid #e2e8f0' },
  pulse: { width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', marginRight: '10px', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.2)' },
  
  heroTitle: { fontWeight: '900', lineHeight: '1.05', letterSpacing: '-2px', marginBottom: '24px' },
  gradientText: { background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSubtitle: { fontSize: 'clamp(16px, 2vw, 20px)', color: '#64748b', lineHeight: '1.7', maxWidth: '680px', margin: '0 auto 48px' },
  
  ctaGroup: { display: 'flex', justifyContent: 'center', width: '100%' },
  mainCta: { backgroundColor: '#3b82f6', color: '#fff', padding: '18px 44px', borderRadius: '50px', border: 'none', fontSize: '18px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 30px -5px rgba(59, 130, 246, 0.4)' },
  
  featureGrid: { display: 'grid', gap: '20px', padding: '20px' },
  featureCard: { backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.5)', padding: '24px', borderRadius: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' },
  smallIcon: { minWidth: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fTitle: { margin: '0 0 4px', fontSize: '18px', fontWeight: '700' },
  fDesc: { margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.5' },
  
  trustBar: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', borderTop: '1px solid #e2e8f0', marginTop: '40px' },
  trustItem: { display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '15px', fontWeight: '600' },
  footer: { textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '12px' }
};