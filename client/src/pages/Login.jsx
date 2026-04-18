import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, ShieldCheck, GraduationCap, Building2, AlertCircle, CheckCircle2 } from "lucide-react";

// --- Notification Component ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? '#10b981' : '#ef4444';

  return (
    <div style={{ ...s.toast, backgroundColor: bgColor }}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span style={{ marginLeft: '8px' }}>{message}</span>
    </div>
  );
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [selectedRole, setSelectedRole] = useState(params.get("role") || "student");

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const validate = () => {
    let tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) tempErrors.email = "Please enter a valid college email";
    if (!password) tempErrors.password = "Password is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      showNotification("Please check your credentials", "error");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { 
        email, 
        password,
        role: selectedRole 
      });
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      showNotification("Welcome back! Redirecting...", "success");

      setTimeout(() => {
        if (res.data.role === "admin") navigate("/admin-dashboard");
        else if (res.data.role === "company") navigate("/company-dashboard");
        else navigate("/student-dashboard");
      }, 1500);

    } catch (err) {
      showNotification(err.response?.data?.msg || "Login Failed", "error");
    }
  };

  return (
    <div style={s.authWrapper}>
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div style={s.authCard}>
        <div style={s.tabContainer}>
          <button 
            onClick={() => setSelectedRole('student')}
            style={selectedRole === 'student' ? s.activeTab : s.tab}
          >
            <GraduationCap size={16} /> Student
          </button>
          <button 
            onClick={() => setSelectedRole('admin')}
            style={selectedRole === 'admin' ? s.activeTab : s.tab}
          >
            <ShieldCheck size={16} /> Admin
          </button>
          <button 
            onClick={() => setSelectedRole('company')}
            style={selectedRole === 'company' ? s.activeTab : s.tab}
          >
            <Building2 size={16} /> Company
          </button>
        </div>

        <div style={s.header}>
          <h2 style={s.title}>{selectedRole.toUpperCase()} PORTAL</h2>
          <p style={s.subtitle}>Secure access to Placement Management System</p>
        </div>

        <form onSubmit={handleLogin} style={s.form}>
          <div style={s.inputContainer}>
            <div style={s.inputGroup}>
              <Mail size={18} style={{...s.inputIcon, color: errors.email ? '#ef4444' : '#94a3b8'}} />
              <input 
                type="email" 
                placeholder="College Email" 
                style={{...s.input, borderColor: errors.email ? '#ef4444' : '#e2e8f0'}}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({...errors, email: null});
                }} 
              />
            </div>
            {errors.email && <span style={s.errorMsg}>{errors.email}</span>}
          </div>

          <div style={s.inputContainer}>
            <div style={s.inputGroup}>
              <Lock size={18} style={{...s.inputIcon, color: errors.password ? '#ef4444' : '#94a3b8'}} />
              <input 
                type="password" 
                placeholder="Password" 
                style={{...s.input, borderColor: errors.password ? '#ef4444' : '#e2e8f0'}}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({...errors, password: null});
                }} 
              />
            </div>
            {errors.password && <span style={s.errorMsg}>{errors.password}</span>}
          </div>

          <button type="submit" style={s.loginBtn}>
            Sign In to Dashboard
          </button>
        </form>

        <p style={s.switchAuth}>
          New to the platform? <span style={s.link} onClick={() => navigate("/register")}>Create account</span>
        </p>
      </div>
    </div>
  );
}

const s = {
  authWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', fontFamily: 'system-ui, sans-serif', padding: '20px' },
  authCard: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '30px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  toast: { position: 'fixed', top: '20px', right: '20px', padding: '12px 20px', borderRadius: '12px', color: '#fff', display: 'flex', alignItems: 'center', zIndex: 1000, boxShadow: '0 10px 15px rgba(0,0,0,0.1)', fontWeight: '600' },
  tabContainer: { display: 'flex', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '14px', marginBottom: '30px', gap: '5px' },
  tab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 5px', border: 'none', backgroundColor: 'transparent', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', borderRadius: '10px' },
  activeTab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 5px', border: 'none', backgroundColor: '#ffffff', color: '#2563eb', fontSize: '13px', fontWeight: '700', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' },
  header: { textAlign: 'center', marginBottom: '30px' },
  title: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#1e293b' },
  subtitle: { margin: '8px 0 0', fontSize: '14px', color: '#94a3b8' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  inputContainer: { display: 'flex', flexDirection: 'column', gap: '4px' },
  inputGroup: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '15px' },
  input: { width: '100%', padding: '14px 14px 14px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  errorMsg: { fontSize: '11px', color: '#ef4444', fontWeight: 'bold', marginLeft: '5px' },
  loginBtn: { backgroundColor: '#1e293b', color: '#ffffff', padding: '15px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
  switchAuth: { textAlign: 'center', marginTop: '25px', fontSize: '14px', color: '#64748b' },
  link: { color: '#2563eb', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }
};