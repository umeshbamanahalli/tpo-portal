import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ ...s.toast, backgroundColor: type === 'success' ? '#10b981' : '#ef4444' }}
        >
            {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ marginLeft: '10px' }}>{message}</span>
        </motion.div>
    );
};

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setNotification({ message: "Please fill all fields", type: "error" });
            return;
        }

        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", res.data.role);
            setNotification({ message: "Login Successful!", type: "success" });
            setTimeout(() => navigate(`/${res.data.role}-dashboard`), 1000);
        } catch (err) {
            setNotification({ message: err.response?.data?.msg || "Login Failed", type: "error" });
        }
    };

    return (
        <div style={s.authWrapper}>
            {/* Consistent Background Blobs */}
            <div style={s.blob1}></div>
            <div style={s.blob2}></div>

            <AnimatePresence>
                {notification && (
                    <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
                )}
            </AnimatePresence>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                style={s.authCard}
            >
                <div style={s.header}>
                    <h2 style={s.title}>Welcome Back</h2>
                    <p style={s.subtitle}>Secure access to your professional dashboard</p>
                </div>

                <form onSubmit={handleLogin} style={s.form}>
                    <div style={s.inputContainer}>
                        <label style={s.label}>Email Address</label>
                        <div style={s.inputGroup}>
                            <Mail size={18} style={s.inputIcon} />
                            <input 
                                type="email" 
                                placeholder="name@example.com"
                                style={s.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div style={s.inputContainer}>
                        <div style={s.labelRow}>
                            <label style={s.label}>Password</label>
                            <span onClick={() => navigate('/forgot-password')} style={s.forgotLink}>
                                Forgot?
                            </span>
                        </div>
                        <div style={s.inputGroup}>
                            <Lock size={18} style={s.inputIcon} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                style={{...s.input, paddingRight: '45px'}}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={s.visibilityBtn}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.02, backgroundColor: '#1d4ed8' }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        style={s.loginBtn}
                    >
                        Sign In <ArrowRight size={18} style={{ marginLeft: '10px' }} />
                    </motion.button>
                </form>

                <p style={s.switchAuth}>
                    New to PlaceNext? <span style={s.link} onClick={() => navigate("/register")}>Create Account</span>
                </p>
            </motion.div>
        </div>
    );
}

const s = {
    authWrapper: { 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#f1f5f9', 
        position: 'relative', 
        overflow: 'hidden', 
        padding: '20px', 
        fontFamily: '"Inter", sans-serif' 
    },
    blob1: { 
        position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', 
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(255,255,255,0) 70%)', 
        zIndex: 0 
    },
    blob2: { 
        position: 'absolute', bottom: '-10%', right: '-5%', width: '600px', height: '600px', 
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(255,255,255,0) 70%)', 
        zIndex: 0 
    },
    authCard: { 
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(12px)', 
        border: '1px solid #fff', 
        padding: '45px 40px', 
        borderRadius: '32px', 
        width: '100%', 
        maxWidth: '440px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)', 
        position: 'relative', 
        zIndex: 1 
    },
    header: { textAlign: 'center', marginBottom: '32px' },
    title: { margin: 0, fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' },
    subtitle: { margin: '8px 0 0', fontSize: '15px', color: '#64748b' },
    form: { display: 'flex', flexDirection: 'column', gap: '24px' },
    inputContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
    labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: '13px', fontWeight: '700', color: '#475569', marginLeft: '4px' },
    forgotLink: { fontSize: '13px', fontWeight: '700', color: '#3b82f6', cursor: 'pointer' },
    inputGroup: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute', left: '16px', color: '#94a3b8' },
    input: { 
        width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px', 
        border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '15px', 
        outline: 'none', transition: '0.2s', fontFamily: 'inherit' 
    },
    visibilityBtn: { position: 'absolute', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
    loginBtn: { 
        backgroundColor: '#3b82f6', color: '#ffffff', padding: '16px', 
        borderRadius: '14px', border: 'none', fontSize: '16px', fontWeight: '700', 
        cursor: 'pointer', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)', 
        transition: '0.2s' 
    },
    switchAuth: { textAlign: 'center', marginTop: '30px', fontSize: '14px', color: '#64748b' },
    link: { color: '#3b82f6', fontWeight: '700', cursor: 'pointer', marginLeft: '5px' },
    toast: { 
        position: 'fixed', top: '24px', right: '24px', padding: '16px 24px', 
        borderRadius: '16px', color: '#fff', display: 'flex', 
        alignItems: 'center', zIndex: 1000, fontWeight: '600', 
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' 
    }
};