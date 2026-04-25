import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    User, Mail, Lock, GraduationCap, Building2, 
    ShieldCheck, ClipboardList, Briefcase, 
    AlertCircle, CheckCircle2, Globe, Eye, EyeOff, ArrowRight 
} from "lucide-react";

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

export default function Register() {
    const [formData, setFormData] = useState({
        email: "", password: "", role: "student",
        name: "", college_id: "", department: "", cgpa: "", intake_type: "Regular",
        website: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (token && role) {
            const routes = { admin: "/admin-dashboard", company: "/company-dashboard", student: "/student-dashboard" };
            navigate(routes[role] || "/student-dashboard");
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
    };

    const validate = () => {
        let tempErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.name.trim()) tempErrors.name = "Required";
        if (!emailRegex.test(formData.email)) tempErrors.email = "Invalid email";
        if (formData.password.length < 6) tempErrors.password = "Min 6 chars";
        if (formData.role === "student") {
            if (!formData.college_id) tempErrors.college_id = "Required";
            const cgpaVal = parseFloat(formData.cgpa);
            if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) tempErrors.cgpa = "0-10 only";
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            const payload = { ...formData, 
                company_name: formData.role === "company" ? formData.name : undefined,
                website_url: formData.role === "company" ? formData.website : undefined
            };
            await axios.post("http://localhost:5000/api/auth/register", payload);
            setNotification({ message: "Account created!", type: "success" });
            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            setNotification({ message: err.response?.data?.msg || "Failed", type: "error" });
        }
    };

    return (
        <div style={s.authWrapper}>
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
                    <h2 style={s.title}>Join PlaceNext</h2>
                    <p style={s.subtitle}>Streamline your professional future today</p>
                </div>

                <div style={s.tabContainer}>
                    {['student', 'company', 'admin'].map((r) => (
                        <button 
                            key={r}
                            type="button" 
                            onClick={() => setFormData({ ...formData, role: r })} 
                            style={formData.role === r ? s.activeTab : s.tab}
                        >
                            {r === 'student' && <GraduationCap size={16} />}
                            {r === 'company' && <Building2 size={16} />}
                            {r === 'admin' && <ShieldCheck size={16} />}
                            <span style={{ textTransform: 'capitalize' }}>{r}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} style={s.form}>
                    <div style={s.inputContainer}>
                        <label style={s.label}>{formData.role === 'company' ? 'Company Name' : 'Full Name'}</label>
                        <div style={s.inputGroup}>
                            <User size={18} style={{ ...s.inputIcon, color: errors.name ? '#ef4444' : '#94a3b8' }} />
                            <input name="name" placeholder="Enter name" style={{ ...s.input, borderColor: errors.name ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={s.inputContainer}>
                        <label style={s.label}>Work Email</label>
                        <div style={s.inputGroup}>
                            <Mail size={18} style={{ ...s.inputIcon, color: errors.email ? '#ef4444' : '#94a3b8' }} />
                            <input name="email" type="email" placeholder="email@example.com" style={{ ...s.input, borderColor: errors.email ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={s.inputContainer}>
                        <label style={s.label}>Password</label>
                        <div style={s.inputGroup}>
                            <Lock size={18} style={{ ...s.inputIcon, color: errors.password ? '#ef4444' : '#94a3b8' }} />
                            <input name="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" style={{ ...s.input, paddingRight: '45px', borderColor: errors.password ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.visibilityBtn}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {formData.role === "student" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={s.roleSection}>
                            <div style={s.inputContainer}>
                                <label style={s.label}>College ID / PRN</label>
                                <div style={s.inputGroup}>
                                    <ClipboardList size={18} style={{ ...s.inputIcon, color: '#94a3b8' }} />
                                    <input name="college_id" placeholder="PRN-12345" style={s.input} onChange={handleChange} />
                                </div>
                            </div>
                            <div style={s.row}>
                                <div style={{ flex: 1.5 }}>
                                    <label style={s.label}>Department</label>
                                    <input name="department" placeholder="e.g. CSE" style={s.inputNoIcon} onChange={handleChange} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={s.label}>CGPA</label>
                                    <input name="cgpa" type="number" step="0.01" placeholder="0.00" style={{ ...s.inputNoIcon, borderColor: errors.cgpa ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                                </div>
                            </div>
                            <div style={s.inputContainer}>
                                <label style={s.label}>Intake Type</label>
                                <select name="intake_type" style={s.inputNoIcon} onChange={handleChange} value={formData.intake_type}>
                                    <option value="Regular">Regular</option>
                                    <option value="Lateral">Lateral</option>
                                    <option value="Transfer">Transfer</option>
                                </select>
                            </div>
                        </motion.div>
                    )}

                    {formData.role === "company" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={s.roleSection}>
                            <label style={s.label}>Corporate Website</label>
                            <div style={s.inputGroup}>
                                <Globe size={18} style={{ ...s.inputIcon, color: '#94a3b8' }} />
                                <input name="website" placeholder="https://..." style={s.input} onChange={handleChange} />
                            </div>
                        </motion.div>
                    )}

                    <motion.button 
                        whileHover={{ scale: 1.02, backgroundColor: '#1d4ed8' }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        style={s.submitBtn}
                    >
                        Create Account <ArrowRight size={18} style={{marginLeft: '10px'}} />
                    </motion.button>
                </form>

                <p style={s.switchAuth}>
                    Already have an account? <span style={s.link} onClick={() => navigate("/login")}>Sign In</span>
                </p>
            </motion.div>
        </div>
    );
}

const s = {
    authWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden', padding: '40px 20px', fontFamily: '"Inter", sans-serif' },
    blob1: { position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(255,255,255,0) 70%)', zIndex: 0 },
    blob2: { position: 'absolute', bottom: '-10%', right: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(255,255,255,0) 70%)', zIndex: 0 },
    authCard: { backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid #fff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)', position: 'relative', zIndex: 1 },
    toast: { position: 'fixed', top: '24px', right: '24px', padding: '16px 24px', borderRadius: '16px', color: '#fff', display: 'flex', alignItems: 'center', zIndex: 1000, fontWeight: '600', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    header: { textAlign: 'center', marginBottom: '32px' },
    title: { margin: 0, fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' },
    subtitle: { margin: '8px 0 0', fontSize: '15px', color: '#64748b' },
    tabContainer: { display: 'flex', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '14px', marginBottom: '30px' },
    tab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: 'none', backgroundColor: 'transparent', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', borderRadius: '10px', transition: '0.2s' },
    activeTab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: 'none', backgroundColor: '#fff', color: '#3b82f6', fontSize: '13px', fontWeight: '700', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputContainer: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', fontWeight: '700', color: '#475569', marginLeft: '4px' },
    inputGroup: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute', left: '16px' },
    input: { width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '15px', outline: 'none', transition: '0.2s' },
    inputNoIcon: { width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '15px', outline: 'none' },
    visibilityBtn: { position: 'absolute', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
    roleSection: { display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' },
    row: { display: 'flex', gap: '15px' },
    submitBtn: { backgroundColor: '#3b82f6', color: '#ffffff', padding: '16px', borderRadius: '14px', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' },
    switchAuth: { textAlign: 'center', marginTop: '30px', fontSize: '14px', color: '#64748b' },
    link: { color: '#3b82f6', fontWeight: '700', cursor: 'pointer', marginLeft: '5px' }
};