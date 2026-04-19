import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <div style={s.authWrapper}>
      <div style={s.authCard}>
        <button onClick={() => navigate("/login")} style={s.backBtn}>
          <ArrowLeft size={18} /> Back to Login
        </button>

        {!isSent ? (
          <>
            <div style={s.header}>
              <h2 style={s.title}>Reset Password</h2>
              <p style={s.subtitle}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleReset} style={s.form}>
              <div style={s.inputContainer}>
                <label style={s.label}>Email Address</label>
                <div style={s.inputGroup}>
                  <Mail size={18} style={s.inputIcon} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    style={s.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" style={s.submitBtn} disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"} 
                {!loading && <Send size={18} style={{ marginLeft: "10px" }} />}
              </button>
            </form>
          </>
        ) : (
          <div style={s.successState}>
            <div style={s.successIcon}>
              <CheckCircle2 size={48} color="#10b981" />
            </div>
            <h2 style={s.title}>Check your email</h2>
            <p style={s.subtitle}>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <button onClick={() => setIsSent(false)} style={s.secondaryBtn}>
              Didn't receive it? Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  authWrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    fontFamily: "'Poppins', sans-serif",
    padding: "20px",
  },
  authCard: {
    backgroundColor: "#ffffff",
    padding: "45px",
    borderRadius: "32px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05)",
    textAlign: "left",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "30px",
    padding: "0",
  },
  header: { marginBottom: "32px" },
  title: { margin: 0, fontSize: "26px", fontWeight: "800", color: "#0f172a" },
  subtitle: { margin: "10px 0 0", fontSize: "15px", color: "#64748b", lineHeight: "1.6" },
  form: { display: "flex", flexDirection: "column", gap: "25px" },
  inputContainer: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#475569" },
  inputGroup: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "16px", color: "#94a3b8" },
  input: {
    width: "100%",
    padding: "14px 16px 14px 48px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    fontSize: "14px",
    outline: "none",
    fontFamily: "'Poppins', sans-serif",
    boxSizing: "border-box",
  },
  submitBtn: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "16px",
    borderRadius: "14px",
    border: "none",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
    transition: "0.2s opacity",
  },
  successState: { textAlign: "center", padding: "20px 0" },
  successIcon: { marginBottom: "20px" },
  secondaryBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "14px",
    marginTop: "20px",
    cursor: "pointer",
    textDecoration: "underline",
  },
};