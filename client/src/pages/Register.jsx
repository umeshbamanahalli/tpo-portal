import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    User, Mail, Lock, GraduationCap, Building2,
    ShieldCheck, ClipboardList, Briefcase,
    AlertCircle, CheckCircle2, Globe
} from "lucide-react";

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
            {message}
        </div>
    );
};

export default function Register() {
    const [formData, setFormData] = useState({
        email: "", password: "", role: "student",
        name: "", college_id: "", department: "", cgpa: "",
        website: "" // Added for companies
    });

    const [errors, setErrors] = useState({});
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();

    const showNotification = (message, type) => {
        setNotification({ message, type });
    };

    const validate = () => {
        let tempErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

        // Common Validations
        if (!formData.name.trim()) {
            tempErrors.name = formData.role === "company" ? "Company name is required" : "Full name is required";
        }

        if (!emailRegex.test(formData.email)) {
            tempErrors.email = "Valid email required";
        } else if (formData.role === "company") {
            // Basic check for corporate email vs personal
            const personalDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
            const domain = formData.email.split("@")[1];
            if (personalDomains.includes(domain)) {
                tempErrors.email = "Please use an official work email";
            }
        }

        if (formData.password.length < 6) tempErrors.password = "Password must be 6+ characters";

        // Role Specific Validations
        if (formData.role === "student") {
            if (!formData.college_id) tempErrors.college_id = "PRN/ID is required";
            if (!formData.department) tempErrors.department = "Department is required";
            const cgpaVal = parseFloat(formData.cgpa);
            if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) tempErrors.cgpa = "Invalid CGPA (0-10)";
        }

        if (formData.role === "company") {
            if (!formData.website) {
                tempErrors.website = "Company website is required";
            } else if (!urlRegex.test(formData.website)) {
                tempErrors.website = "Enter a valid URL (e.g., https://google.com)";
            }
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            showNotification("Please correct the errors in the form", "error");
            return;
        }

        try {
            const payload = {
                ...formData,
                company_name: formData.role === "company" ? formData.name : undefined,
                website_url: formData.role === "company" ? formData.website : undefined
            };

            const res = await axios.post("http://localhost:5000/api/auth/register", payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }); showNotification(res.data.msg || "Account Created!", "success");
            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            showNotification(err.response?.data?.msg || "Registration Failed", "error");
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
                <div style={s.header}>
                    <h2 style={s.title}>Join PlaceNext</h2>
                    <p style={s.subtitle}>Create your professional placement account</p>
                </div>

                <div style={s.tabContainer}>
                    <button type="button" onClick={() => setFormData({ ...formData, role: 'student' })} style={formData.role === 'student' ? s.activeTab : s.tab}>
                        <GraduationCap size={16} /> Student
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, role: 'admin' })} style={formData.role === 'admin' ? s.activeTab : s.tab}>
                        <ShieldCheck size={16} /> Admin
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, role: 'company' })} style={formData.role === 'company' ? s.activeTab : s.tab}>
                        <Building2 size={16} /> Company
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={s.form}>
                    {/* Dynamic Name Field */}
                    <div style={s.inputContainer}>
                        <div style={s.inputGroup}>
                            {formData.role === 'company' ? <Building2 size={18} style={{ ...s.inputIcon, color: errors.name ? '#ef4444' : '#94a3b8' }} /> : <User size={18} style={{ ...s.inputIcon, color: errors.name ? '#ef4444' : '#94a3b8' }} />}
                            <input name="name" placeholder={formData.role === 'company' ? "Company Name" : "Full Name"} style={{ ...s.input, borderColor: errors.name ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                        </div>
                        {errors.name && <span style={s.errorMsg}>{errors.name}</span>}
                    </div>

                    {/* Dynamic Email Field */}
                    <div style={s.inputContainer}>
                        <div style={s.inputGroup}>
                            <Mail size={18} style={{ ...s.inputIcon, color: errors.email ? '#ef4444' : '#94a3b8' }} />
                            <input name="email" type="email" placeholder={formData.role === 'company' ? "Official Work Email" : "College Email"} style={{ ...s.input, borderColor: errors.email ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                        </div>
                        {errors.email && <span style={s.errorMsg}>{errors.email}</span>}
                    </div>

                    {/* Password */}
                    <div style={s.inputContainer}>
                        <div style={s.inputGroup}>
                            <Lock size={18} style={{ ...s.inputIcon, color: errors.password ? '#ef4444' : '#94a3b8' }} />
                            <input name="password" type="password" placeholder="Create Password" style={{ ...s.input, borderColor: errors.password ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                        </div>
                        {errors.password && <span style={s.errorMsg}>{errors.password}</span>}
                    </div>

                    {/* Student Specific Fields */}
                    {formData.role === "student" && (
                        <div style={s.roleFields}>
                            <div style={s.inputContainer}>
                                <div style={s.inputGroup}>
                                    <ClipboardList size={18} style={{ ...s.inputIcon, color: errors.college_id ? '#ef4444' : '#94a3b8' }} />
                                    <input name="college_id" placeholder="PRN / ID" style={{ ...s.input, borderColor: errors.college_id ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                                </div>
                                {errors.college_id && <span style={s.errorMsg}>{errors.college_id}</span>}
                            </div>
                            <div style={s.row}>
                                <div style={{ flex: 2 }}>
                                    <div style={s.inputGroup}>
                                        <Briefcase size={18} style={{ ...s.inputIcon, color: errors.department ? '#ef4444' : '#94a3b8' }} />
                                        <input name="department" placeholder="Dept" style={{ ...s.input, borderColor: errors.department ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                                    </div>
                                    {errors.department && <span style={s.errorMsg}>{errors.department}</span>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input name="cgpa" type="number" step="0.01" placeholder="CGPA" style={{ ...s.inputNoIcon, borderColor: errors.cgpa ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                                    {errors.cgpa && <span style={s.errorMsg}>{errors.cgpa}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Company Specific Fields */}
                    {formData.role === "company" && (
                        <div style={s.roleFields}>
                            <div style={s.inputContainer}>
                                <div style={s.inputGroup}>
                                    <Globe size={18} style={{ ...s.inputIcon, color: errors.website ? '#ef4444' : '#94a3b8' }} />
                                    <input name="website" placeholder="Company Website (https://...)" style={{ ...s.input, borderColor: errors.website ? '#ef4444' : '#e2e8f0' }} onChange={handleChange} />
                                </div>
                                {errors.website && <span style={s.errorMsg}>{errors.website}</span>}
                            </div>
                        </div>
                    )}

                    <button type="submit" style={s.submitBtn}>Create Account</button>
                </form>

                <p style={s.switchAuth}>
                    Already have an account? <span style={s.link} onClick={() => navigate("/login")}>Sign In</span>
                </p>
            </div>
        </div>
    );
}

const s = {
    // ... same as your previous s object ...
    roleFields: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' },
    // Ensure all previous styles from s are included here
    authWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', fontFamily: 'system-ui, sans-serif', padding: '40px 20px' },
    authCard: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '30px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
    toast: { position: 'fixed', top: '20px', right: '20px', padding: '12px 20px', borderRadius: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' },
    header: { textAlign: 'center', marginBottom: '30px' },
    title: { margin: 0, fontSize: '26px', fontWeight: '900', color: '#1e293b' },
    subtitle: { margin: '8px 0 0', fontSize: '14px', color: '#94a3b8' },
    tabContainer: { display: 'flex', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '14px', marginBottom: '25px', gap: '5px' },
    tab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 5px', border: 'none', backgroundColor: 'transparent', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderRadius: '10px' },
    activeTab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 5px', border: 'none', backgroundColor: '#ffffff', color: '#2563eb', fontSize: '12px', fontWeight: '700', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    inputContainer: { display: 'flex', flexDirection: 'column', gap: '4px' },
    inputGroup: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute', left: '15px' },
    input: { width: '100%', padding: '14px 14px 14px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    inputNoIcon: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    errorMsg: { fontSize: '11px', color: '#ef4444', fontWeight: 'bold', marginLeft: '5px' },
    row: { display: 'flex', gap: '10px' },
    submitBtn: { backgroundColor: '#1e293b', color: '#ffffff', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
    switchAuth: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' },
    link: { color: '#2563eb', fontWeight: '700', cursor: 'pointer' }
};