import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Home, Search } from 'lucide-react';

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div style={s.container}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        style={s.errorCard}
      >
        <div style={s.iconArea}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <AlertCircle size={80} color="#ef4444" />
          </motion.div>
        </div>

        <h1 style={s.title}>404</h1>
        <h2 style={s.subtitle}>Page Not Found</h2>
        <p style={s.text}>
          The resource you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable.
        </p>

        <div style={s.actionGroup}>
          <button onClick={() => navigate(-1)} style={s.secondaryBtn}>
            <ArrowLeft size={18} /> Go Back
          </button>
          <button onClick={() => navigate('/')} style={s.primaryBtn}>
            <Home size={18} /> Back to Home
          </button>
        </div>

        <div style={s.footer}>
          <Search size={14} /> <span>Need help? Contact the TPO Administration.</span>
        </div>
      </motion.div>
    </div>
  );
}

const s = {
  container: { 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#f8fafc',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    padding: '20px'
  },
  errorCard: { 
    maxWidth: '500px', 
    width: '100%', 
    textAlign: 'center', 
    backgroundColor: '#fff', 
    padding: '60px 40px', 
    borderRadius: '32px', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0'
  },
  iconArea: { marginBottom: '30px', display: 'flex', justifyContent: 'center' },
  title: { fontSize: '120px', fontWeight: '900', color: '#f1f5f9', margin: '0', lineHeight: '1' },
  subtitle: { fontSize: '28px', fontWeight: '800', color: '#1e293b', marginTop: '-40px' },
  text: { color: '#64748b', fontSize: '16px', lineHeight: '1.6', margin: '20px 0 40px' },
  actionGroup: { display: 'flex', gap: '15px', justifyContent: 'center' },
  primaryBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  secondaryBtn: { backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '14px 24px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  footer: { marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
};