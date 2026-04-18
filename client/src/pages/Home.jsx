import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const portals = [
    {
      title: "Student Portal",
      desc: "Apply for drives, track applications, and manage your placement profile.",
      icon: <GraduationCap size={32} />,
      path: "/login?role=student",
      accent: "#2563eb",
      light: "#eff6ff"
    },
    {
      title: "Company Portal",
      desc: "Post new job drives, shortlist candidates, and manage campus recruitment.",
      icon: <Building2 size={32} />,
      path: "/login?role=company",
      accent: "#059669",
      light: "#ecfdf5"
    },
    {
      title: "TPO Admin",
      desc: "Complete oversight of placement statistics, student verification, and reports.",
      icon: <ShieldCheck size={32} />,
      path: "/login?role=admin",
      accent: "#7c3aed",
      light: "#f5f3ff"
    }
  ];

  return (
    <div style={s.container}>
      {/* Navigation */}
      <nav style={s.navbar}>
        <h1 style={s.logo}>PlaceNext<span style={{ color: '#1e293b' }}>DMS</span></h1>
        <button onClick={() => navigate('/register')} style={s.navBtn}>
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <header style={s.hero}>
        <div style={s.badge}>V2.0 Placement Management</div>
        <h2 style={s.heroTitle}>
          The Central Hub for <span style={{ color: '#2563eb' }}>Campus Placements</span>
        </h2>
        <p style={s.heroSubtitle}>
          Streamlining the connection between students, training & placement officers, and global recruiters in one unified platform.
        </p>
      </header>

      {/* Portal Cards Section */}
      <section style={s.cardGrid}>
        {portals.map((portal, index) => (
          <div 
            key={index} 
            style={s.card}
            onClick={() => navigate(portal.path)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ ...s.iconWrapper, backgroundColor: portal.light, color: portal.accent }}>
              {portal.icon}
            </div>
            <h3 style={s.cardTitle}>{portal.title}</h3>
            <p style={s.cardDesc}>{portal.desc}</p>
            <div style={{ ...s.cardLink, color: portal.accent }}>
              Enter Portal <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </div>
          </div>
        ))}
      </section>

      {/* Stats/Info Bar */}
      <div style={s.infoSection}>
        <div style={s.infoItem}><strong>500+</strong> Students Placed</div>
        <div style={s.infoItem}><strong>50+</strong> Partner Companies</div>
        <div style={s.infoItem}><strong>100%</strong> Digital Workflow</div>
      </div>

      <footer style={s.footer}>
        <p>© 2026 PlaceNext Management System | Built for PW-CS608 Mini-Project</p>
      </footer>
    </div>
  );
}

const s = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#1e293b'
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 80px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#2563eb',
    margin: 0
  },
  navBtn: {
    backgroundColor: '#2563eb',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: '50px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    transition: '0.3s'
  },
  hero: {
    textAlign: 'center',
    padding: '80px 20px',
    maxWidth: '900px',
    margin: '0 auto'
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '6px 16px',
    borderRadius: '50px',
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '20px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '24px',
    color: '#0f172a'
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#64748b',
    lineHeight: '1.6',
    maxWidth: '700px',
    margin: '0 auto'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 40px 100px'
  },
  card: {
    padding: '40px',
    borderRadius: '24px',
    border: '1px solid #f1f5f9',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  iconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '12px',
    color: '#0f172a'
  },
  cardDesc: {
    fontSize: '15px',
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '24px'
  },
  cardLink: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: '700',
    fontSize: '14px'
  },
  infoSection: {
    display: 'flex',
    justifyContent: 'center',
    gap: '60px',
    padding: '40px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #f1f5f9'
  },
  infoItem: {
    fontSize: '14px',
    color: '#475569'
  },
  footer: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8',
    fontSize: '13px'
  }
};