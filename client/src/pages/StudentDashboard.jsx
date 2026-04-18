import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Briefcase, LayoutDashboard, LogOut,
  FileText, CheckCircle2, AlertCircle, RefreshCcw, Save,
  UserCircle, GraduationCap, MapPin, Upload
} from 'lucide-react';

// --- Sub-components ---

const AppliedJobsView = ({ applications }) => (
  <div style={s.viewContainer}>
    <h2 style={s.gridTitle}>My Career Journey</h2>
    <div style={s.jobGrid}>
      {applications.length > 0 ? applications.map(app => (
        <div key={app.application_id} style={s.jobCard}>
          <div style={s.jobTop}>
            <span style={s.jobRole}>{app.job_role}</span>
            <span style={{
              ...s.jobPackage,
              backgroundColor: app.status?.toLowerCase() === 'shortlisted' ? '#dcfce7' : '#eff6ff',
              color: app.status?.toLowerCase() === 'shortlisted' ? '#166534' : '#2563eb'
            }}>
              {app.status}
            </span>
          </div>
          <p style={s.companyName}>{app.company_name}</p>
          <div style={s.jobDetails}>
            <div style={s.detailRow}><span>Applied on</span> <strong>{new Date(app.applied_at).toLocaleDateString()}</strong></div>
          </div>
        </div>
      )) : (
        <div style={s.emptyState}>No applications found. Opportunity is waiting!</div>
      )}
    </div>
  </div>
);

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [student, setStudent] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setLoading(true);
      setDashboardError("");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [profileRes, drivesRes, appRes] = await Promise.all([
        axios.get('http://localhost:5000/api/student/profile', config),
        axios.get('http://localhost:5000/api/student/drives', config),
        axios.get('http://localhost:5000/api/student/my-applications', config)
      ]);

      setStudent(profileRes.data);
      setResumeUrl(profileRes.data.resume_url || "");
      setJobs(Array.isArray(drivesRes.data) ? drivesRes.data : []);
      setApplications(Array.isArray(appRes.data) ? appRes.data : []);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setDashboardError(err.response?.data?.msg || "Unable to load drives right now.");
      setJobs([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleApply = async (driveId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5000/api/student/apply',
        { drive_id: driveId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Application successful!");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to apply");
    }
  };


    const handleFullUpdate = async () => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    // Append text fields
    formData.append('full_name', student.full_name);
    formData.append('department', student.department);
    formData.append('cgpa', student.cgpa);
    
    // Append the file if selected, otherwise send the existing URL
    if (selectedFile) {
      formData.append('resume', selectedFile);
    } else {
      formData.append('resume_url', resumeUrl);
    }

    try {
      setLoading(true);
      await axios.put('http://localhost:5000/api/student/update-profile', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' // Critical for file upload
        }
      });
      alert("Profile and Resume updated successfully!");
      fetchData();
      setActiveTab('dashboard');
      setSelectedFile(null); // Reset file picker
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={s.loaderContainer}>
      <RefreshCcw className="animate-spin" size={40} color="#2563eb" />
      <p style={{ marginTop: '15px', fontWeight: '700', color: '#1e293b' }}>Loading your portal...</p>
    </div>
  );

  return (
    <div style={s.pageWrapper}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.logoArea}>
          <div style={s.logoIcon}>PN</div>
          <span style={s.logoText}>PlaceNext</span>
        </div>
        <nav style={s.nav}>
          <div onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? { ...s.navItem, ...s.navActive } : s.navItem}>
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div onClick={() => setActiveTab('applied')} style={activeTab === 'applied' ? { ...s.navItem, ...s.navActive } : s.navItem}>
            <Briefcase size={20} /> Applications
          </div>
          <div onClick={() => setActiveTab('profile')} style={activeTab === 'profile' ? { ...s.navItem, ...s.navActive } : s.navItem}>
            <UserCircle size={20} /> My Profile
          </div>
        </nav>
        <button style={s.logoutBtn} onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={s.mainContent}>
        <header style={s.topHeader}>
          <div>
            <h1 style={s.welcome}>Hello, {student?.full_name?.split(' ')[0]} 👋</h1>
            <p style={s.dateText}>{student?.college_id} • {student?.department || 'CSE'}</p>
          </div>
          <button style={s.logoutBtnHeader} onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>
            <LogOut size={16} />
            Logout
          </button>
        </header>

        {activeTab === 'applied' ? (
          <AppliedJobsView applications={applications} />
        ) : activeTab === 'profile' ? (
          /* BEAUTIFUL PROFILE SECTION */
          <div style={s.profileCard}>
            <div style={s.profileHeader}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Edit Profile</h2>
              <span style={s.verifiedBadge}>Active Student</span>
            </div>

            <div style={s.formGrid}>
              <div style={s.formGroup}>
                <label style={s.label}>Full Name</label>
                <input
                  style={s.inputField}
                  value={student?.full_name || ""}
                  onChange={(e) => setStudent({ ...student, full_name: e.target.value })}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>College ID</label>
                <input
                  style={{ ...s.inputField, backgroundColor: '#f8fafc', color: '#94a3b8' }}
                  value={student?.college_id || ""}
                  disabled
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Department</label>
                <select
                  style={s.inputField}
                  value={student?.department || "CSE"}
                  onChange={(e) => setStudent({ ...student, department: e.target.value })}
                >
                  <option value="Computer Science Engineering">Computer Science Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics Engineering">Electronics Engineering</option>
                </select>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Current CGPA</label>
                <input
                  type="number" step="0.01" style={s.inputField}
                  value={student?.cgpa || ""}
                  onChange={(e) => setStudent({ ...student, cgpa: e.target.value })}
                />
              </div>
            </div>

              <div style={{ marginTop: '30px' }}>
              <label style={s.label}><FileText size={16} /> Resume / CV (PDF or Word)</label>

              <div
                style={s.filePickerArea}
                onClick={() => document.getElementById('resumeUpload').click()}
              >
                <input
                  type="file"
                  id="resumeUpload"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />

                {selectedFile ? (
                  <div style={s.fileInfo}>
                    <CheckCircle2 size={24} color="#16a34a" />
                    <div>
                      <p style={s.fileName}>{selectedFile.name}</p>
                      <p style={s.fileSize}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <div style={s.pickerContent}>
                    <Upload size={24} color="#2563eb" />
                    <p style={s.pickerText}>
                      {resumeUrl ? "Change your resume" : "Click to upload resume"}
                    </p>
                    <span style={s.pickerSubtext}>Supported formats: PDF, DOC (Max 5MB)</span>
                  </div>
                )}
              </div>
            </div>
          
            <div style={s.buttonGroup}>
              <button style={s.saveBtnLarge} onClick={handleFullUpdate}><Save size={18} /> Sync Profile</button>
              <button style={s.cancelBtn} onClick={() => setActiveTab('dashboard')}>Cancel</button>
            </div>
          </div>
        ) : (
          /* DASHBOARD VIEW */
          <>
            <div style={s.dashboardGrid}>
              <div style={s.resumeActionCard}>
                <div style={s.flexBetween}>
                  <h3 style={s.cardHeading}><FileText size={20} color="#2563eb" /> Professional Resume</h3>
                  <button style={s.textLink} onClick={() => setActiveTab('profile')}>Edit</button>
                </div>
                <p style={s.cardDesc}>Your resume is shared with companies when you apply. Keep it updated!</p>
                <div style={s.linkBox}>{resumeUrl || "No resume link added yet."}</div>
              </div>

              <div style={s.academicStatCard}>
                <GraduationCap size={32} color="#fff" style={{ opacity: 0.8 }} />
                <div>
                  <p style={s.statLabel}>Current CGPA</p>
                  <h2 style={s.statBigValue}>{student?.cgpa}</h2>
                </div>
              </div>
            </div>

            <h2 style={s.gridTitle}>Active Recruitment Drives</h2>
            {dashboardError && (
              <div style={s.errorBanner}>{dashboardError}</div>
            )}
            <div style={s.jobGrid}>
              {jobs.length === 0 && (
                <div style={s.emptyState}>No active drives available right now. Please check again later.</div>
              )}
              {jobs.map(job => {
                const hasApplied = applications.some(app => app.drive_id === job.drive_id);
                const isEligible = parseFloat(student?.cgpa) >= parseFloat(job.min_cgpa_required);

                return (
                  <div key={job.drive_id} style={s.jobCard}>
                    <div style={s.jobTop}>
                      <span style={s.jobRole}>{job.job_role}</span>
                      <span style={s.jobPackage}>{job.ctc_package} LPA</span>
                    </div>
                    <div style={s.companyInfo}><MapPin size={14} /> {job.company_name}</div>

                    <div style={s.jobDetails}>
                      <div style={s.detailRow}><span>Min CGPA</span> <strong>{job.min_cgpa_required}</strong></div>
                      <div style={s.detailRow}><span>Deadline</span> <strong>{new Date(job.deadline).toLocaleDateString()}</strong></div>
                    </div>

                    {hasApplied ? (
                      <div style={s.appliedBadge}><CheckCircle2 size={16} /> Application Sent</div>
                    ) : !isEligible ? (
                      <div style={s.lockedButton}><AlertCircle size={16} /> Below Cutoff</div>
                    ) : (
                      <button style={s.applyButton} onClick={() => handleApply(job.drive_id)}>Apply Now</button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const s = {
  pageWrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', sans-serif" },
  loaderContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%' },

  // Sidebar
  sidebar: { width: '280px', backgroundColor: '#fff', position: 'fixed', height: '100vh', padding: '40px 24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '50px' },
  logoIcon: { background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' },
  logoText: { fontSize: '22px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '14px', color: '#64748b', fontWeight: '600', cursor: 'pointer', transition: '0.2s' },
  navActive: { backgroundColor: '#eff6ff', color: '#2563eb' },
  logoutBtn: {
    padding: '14px',
    border: '1px solid #fecaca',
    background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    color: '#dc2626',
    fontWeight: '700',
    borderRadius: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },

  // Main Content
  mainContent: { flex: 1, marginLeft: '280px', padding: '50px 60px' },
  topHeader: { marginBottom: '40px' },
  welcome: { fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0 },
  dateText: { color: '#94a3b8', fontWeight: '500', marginTop: '5px' },
  logoutBtnHeader: {
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontWeight: '700',
    boxShadow: '0 8px 20px -8px rgba(220, 38, 38, 0.6)'
  },

  // Dashboard Cards
  dashboardGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '40px' },
  resumeActionCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  cardHeading: { margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' },
  cardDesc: { color: '#64748b', fontSize: '14px', margin: '10px 0 20px 0' },
  linkBox: { padding: '12px 18px', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#2563eb', fontSize: '13px', fontWeight: '600', border: '1px dashed #cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis' },
  academicStatCard: { background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', padding: '30px', borderRadius: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: '20px' },
  statLabel: { margin: 0, fontSize: '14px', opacity: 0.8 },
  statBigValue: { margin: 0, fontSize: '48px', fontWeight: '900' },
  flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  textLink: { background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer', fontSize: '14px' },

  // Job Grid
  gridTitle: { fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '25px' },
  jobGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  jobCard: { backgroundColor: '#fff', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', transition: 'transform 0.2s', position: 'relative' },
  jobTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' },
  jobRole: { fontWeight: '800', fontSize: '18px', color: '#1e293b', maxWidth: '70%' },
  jobPackage: { padding: '5px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' },
  companyInfo: { color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', marginBottom: '20px' },
  jobDetails: { borderTop: '1px solid #f1f5f9', paddingTop: '18px', marginBottom: '20px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: '#475569' },
  applyButton: { width: '100%', padding: '14px', borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontWeight: '800', cursor: 'pointer', transition: '0.2s' },
  appliedBadge: { width: '100%', padding: '14px', borderRadius: '16px', backgroundColor: '#f1f5f9', color: '#64748b', textAlign: 'center', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  lockedButton: { width: '100%', padding: '14px', borderRadius: '16px', backgroundColor: '#fff1f1', color: '#ef4444', textAlign: 'center', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },

  // Profile Specific
  profileCard: { backgroundColor: '#fff', padding: '40px', borderRadius: '28px', border: '1px solid #e2e8f0' },
  profileHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' },
  verifiedBadge: { backgroundColor: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '14px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' },
  inputField: { padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px', color: '#1e293b', transition: '0.2s' },
  buttonGroup: { display: 'flex', gap: '15px', marginTop: '40px' },
  saveBtnLarge: { padding: '16px 32px', borderRadius: '16px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  cancelBtn: { padding: '16px 32px', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#64748b', fontWeight: '800', cursor: 'pointer' },
  emptyState: { padding: '100px 0', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }
  ,errorBanner: {
    marginBottom: '16px',
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: '#fff1f2',
    color: '#b91c1c',
    border: '1px solid #fecdd3',
    fontWeight: '600'
  }

  ,filePickerArea: {
    marginTop: '10px',
    padding: '30px',
    borderRadius: '16px',
    border: '2px dashed #cbd5e1',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    textAlign: 'center',
    transition: '0.2s',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pickerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  pickerText: {
    margin: 0,
    fontWeight: '700',
    color: '#1e293b',
    fontSize: '15px'
  },
  pickerSubtext: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    textAlign: 'left'
  },
  fileName: {
    margin: 0,
    fontWeight: '700',
    color: '#1e293b',
    fontSize: '14px'
  },
  fileSize: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b'
  }
};