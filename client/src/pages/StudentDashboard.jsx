import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, LayoutDashboard, LogOut, FileText, CheckCircle2, 
  AlertCircle, RefreshCcw, UserCircle, GraduationCap, 
  MapPin, Upload, ChevronRight, X
} from 'lucide-react';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [student, setStudent] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [profileRes, drivesRes, appRes] = await Promise.all([
        axios.get('http://localhost:5000/api/student/profile', config),
        axios.get('http://localhost:5000/api/student/drives', config),
        axios.get('http://localhost:5000/api/student/my-applications', config)
      ]);
      setStudent(profileRes.data);
      setJobs(Array.isArray(drivesRes.data) ? drivesRes.data : []);
      setApplications(Array.isArray(appRes.data) ? appRes.data : []);
    } catch (err) { console.error("Sync Error", err); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchData]);

  const handleApply = async (driveId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/student/apply', { drive_id: driveId }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert(err.response?.data?.msg || "Apply failed"); }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('full_name', student.full_name);
      formData.append('department', student.department);
      formData.append('cgpa', student.cgpa);
      if (selectedFile) formData.append('resume', selectedFile);

      await axios.put('http://localhost:5000/api/student/update-profile', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      fetchData();
      setActiveTab('dashboard');
    } catch (err) { alert("Update failed"); } 
    finally { setLoading(false); }
  };

  if (loading) return <div style={s.loaderContainer}><RefreshCcw className="animate-spin" size={40} color="#3b82f6" /></div>;

  return (
    <div style={{...s.pageWrapper, flexDirection: isMobile ? 'column' : 'row'}}>
      
      {/* --- Navigation --- */}
      {!isMobile ? (
        <aside style={s.sidebar}>
          <div style={s.logoArea}><div style={s.logoIcon}>PN</div><span style={s.logoText}>PlaceNext</span></div>
          <nav style={s.nav}>
            <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
            <NavItem active={activeTab === 'applied'} icon={<Briefcase size={20}/>} label="Applications" onClick={() => setActiveTab('applied')} />
            <NavItem active={activeTab === 'profile'} icon={<UserCircle size={20}/>} label="My Profile" onClick={() => setActiveTab('profile')} />
          </nav>
          <button style={s.logoutBtn} onClick={() => { localStorage.clear(); window.location.href = '/login'; }}><LogOut size={18} /> Logout</button>
        </aside>
      ) : (
        <nav style={s.bottomNav}>
          <div style={{...s.navItemMobile, color: activeTab === 'dashboard' ? '#3b82f6' : '#94a3b8'}} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={24} /><span style={s.navLabelMobile}>Home</span></div>
          <div style={{...s.navItemMobile, color: activeTab === 'applied' ? '#3b82f6' : '#94a3b8'}} onClick={() => setActiveTab('applied')}><Briefcase size={24} /><span style={s.navLabelMobile}>Applied</span></div>
          <div style={{...s.navItemMobile, color: activeTab === 'profile' ? '#3b82f6' : '#94a3b8'}} onClick={() => setActiveTab('profile')}><UserCircle size={24} /><span style={s.navLabelMobile}>Profile</span></div>
          <div style={{...s.navItemMobile, color: '#ef4444'}} onClick={() => { localStorage.clear(); window.location.href = '/login'; }}><LogOut size={24} /><span style={s.navLabelMobile}>Exit</span></div>
        </nav>
      )}

      {/* --- Main Content --- */}
      <main style={{...s.mainContent, marginLeft: isMobile ? 0 : '280px', padding: isMobile ? '20px' : '40px 60px', paddingBottom: isMobile ? '100px' : '40px'}}>
        <header style={s.topHeader}>
          <h1 style={{...s.welcome, fontSize: isMobile ? '24px' : '32px'}}>Hello, {student?.full_name?.split(' ')[0]}!</h1>
          <p style={s.dateText}>{student?.college_id} • {student?.department}</p>
        </header>

        <AnimatePresence mode="wait">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{...s.dashboardGrid, gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr'}}>
                <div style={s.resumeActionCard}>
                  <div style={s.flexBetween}><h3 style={s.cardHeading}><FileText size={20} color="#3b82f6" /> Resume Status</h3></div>
                  <div style={s.linkBox}>{student?.resume_url ? "✅ Resume Linked" : "⚠️ Upload Required"}</div>
                </div>
                <div style={s.academicStatCard}>
                  <div><p style={s.statLabel}>Current CGPA</p><h2 style={s.statBigValue}>{student?.cgpa}</h2></div>
                  <GraduationCap size={40} style={{ opacity: 0.3 }} />
                </div>
              </div>
              <h2 style={s.gridTitle}>Eligible Drives</h2>
              <div style={s.jobGrid}>
                {jobs.map(job => (
                  <JobCard key={job.drive_id} job={job} onApply={handleApply} hasApplied={applications.some(app => app.drive_id === job.drive_id)} isEligible={parseFloat(student?.cgpa) >= parseFloat(job.min_cgpa_required)} />
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 2: APPLICATIONS */}
          {activeTab === 'applied' && (
            <motion.div key="app" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={s.gridTitle}>My Career Journey</h2>
              <div style={s.jobGrid}>
                {applications.length > 0 ? applications.map(app => (
                  <div key={app.application_id} style={s.jobCard}>
                    <div style={s.jobTop}><span style={s.jobRole}>{app.job_role}</span><span style={{...s.statusBadge, backgroundColor: app.status?.toLowerCase() === 'shortlisted' ? '#dcfce7' : '#eff6ff', color: app.status?.toLowerCase() === 'shortlisted' ? '#166534' : '#3b82f6'}}>{app.status}</span></div>
                    <p style={s.companyInfo}><MapPin size={14} /> {app.company_name}</p>
                    <div style={s.detailRow}><span>Applied On:</span> <b>{new Date(app.applied_at).toLocaleDateString()}</b></div>
                  </div>
                )) : <p style={s.emptyText}>No applications yet. Start applying!</p>}
              </div>
            </motion.div>
          )}

          {/* TAB 3: PROFILE */}
          {activeTab === 'profile' && (
            <motion.div key="prof" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={s.profileCard}>
              <h2 style={{...s.gridTitle, marginBottom: '20px'}}>Update Profile</h2>
              <div style={{...s.formGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'}}>
                <div style={s.formGroup}><label style={s.label}>Full Name</label><input style={s.inputField} value={student.full_name} onChange={e => setStudent({...student, full_name: e.target.value})} /></div>
                <div style={s.formGroup}><label style={s.label}>Department</label><input style={s.inputField} value={student.department} onChange={e => setStudent({...student, department: e.target.value})} /></div>
                <div style={s.formGroup}><label style={s.label}>CGPA</label><input style={s.inputField} type="number" value={student.cgpa} onChange={e => setStudent({...student, cgpa: e.target.value})} /></div>
                <div style={s.formGroup}><label style={s.label}>Resume (PDF)</label><input type="file" onChange={e => setSelectedFile(e.target.files[0])} /></div>
              </div>
              <button style={{...s.applyButton, marginTop: '30px', maxWidth: '200px'}} onClick={handleUpdateProfile}>Save Changes</button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Helper Components & Styles ---
const NavItem = ({ active, icon, label, onClick }) => (
  <div onClick={onClick} style={active ? { ...s.navItem, ...s.navActive } : s.navItem}>{icon} {label}</div>
);

const JobCard = ({ job, hasApplied, isEligible, onApply }) => (
  <div style={s.jobCard}>
    <div style={s.jobTop}><div style={s.jobRole}>{job.job_role}</div><div style={s.jobPackage}>{job.ctc_package} LPA</div></div>
    <div style={s.companyInfo}><MapPin size={14} /> {job.company_name}</div>
    {hasApplied ? <div style={s.appliedBadge}>Applied</div> : !isEligible ? <div style={s.lockedButton}>Ineligible</div> : <button style={s.applyButton} onClick={() => onApply(job.drive_id)}>Apply Now</button>}
  </div>
);

const s = {
  pageWrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '280px', backgroundColor: '#fff', position: 'fixed', height: '100vh', padding: '40px 24px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000 },
  navItemMobile: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  navLabelMobile: { fontSize: '10px', fontWeight: '700' },
  mainContent: { flex: 1, transition: 'all 0.3s ease' },
  topHeader: { marginBottom: '32px' },
  welcome: { fontWeight: '900', color: '#0f172a', margin: 0 },
  dateText: { color: '#64748b', fontSize: '14px' },
  dashboardGrid: { display: 'grid', gap: '20px', marginBottom: '32px' },
  resumeActionCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  academicStatCard: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', padding: '24px', borderRadius: '24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statBigValue: { fontSize: '32px', fontWeight: '900', margin: 0 },
  gridTitle: { fontSize: '20px', fontWeight: '900', marginBottom: '20px' },
  jobGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  jobCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  jobTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  jobRole: { fontWeight: '800', color: '#0f172a' },
  jobPackage: { color: '#3b82f6', fontWeight: '800' },
  companyInfo: { color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '15px' },
  applyButton: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: '700', cursor: 'pointer' },
  appliedBadge: { width: '100%', padding: '12px', textAlign: 'center', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '12px', fontWeight: '700' },
  lockedButton: { width: '100%', padding: '12px', textAlign: 'center', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '12px', fontWeight: '700' },
  statusBadge: { padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: '#64748b', cursor: 'pointer', fontWeight: '600' },
  navActive: { backgroundColor: '#eff6ff', color: '#3b82f6' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' },
  logoIcon: { background: '#3b82f6', color: '#fff', padding: '5px 8px', borderRadius: '8px', fontWeight: '900' },
  logoText: { fontSize: '20px', fontWeight: '800' },
  logoutBtn: { marginTop: 'auto', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  linkBox: { padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', marginTop: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#475569' },
  cardHeading: { margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  loaderContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  profileCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  formGrid: { display: 'grid', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#475569' },
  inputField: { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' },
  detailRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px' },
  emptyText: { color: '#94a3b8', textAlign: 'center', width: '100%', padding: '40px' }
};