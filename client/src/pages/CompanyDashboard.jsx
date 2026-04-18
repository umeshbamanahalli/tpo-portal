import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, PlusCircle, LogOut, 
  Send, Users, BarChart3, ShieldAlert 
} from 'lucide-react';

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [stats, setStats] = useState({ total_jobs: 0, total_applications: 0, total_shortlisted: 0 });
  const [isApproved, setIsApproved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Updated state to match SQL: placement_drives columns
  const [newJob, setNewJob] = useState({ 
    job_role: '', 
    ctc_package: '', 
    min_cgpa_required: '', 
    deadline: '' 
  });

  const triggerNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const fetchMyJobs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/jobs/my-jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 403) {
        setIsApproved(false);
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        triggerNotification(errData.msg || "Failed to fetch job listings", "error");
        setJobs([]);
        return;
      }

      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
      setIsApproved(true);
    } catch {
      triggerNotification("Failed to fetch job listings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyJobs();
  }, [fetchMyJobs]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/jobs/company-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        triggerNotification(errData.msg || "Could not load analytics", "error");
        return;
      }
      const data = await res.json();
      setStats({
        total_jobs: Number(data?.total_jobs || 0),
        total_applications: Number(data?.total_applications || 0),
        total_shortlisted: Number(data?.total_shortlisted || 0)
      });
      setActiveTab('analytics');
    } catch {
      triggerNotification("Could not load analytics", "error");
    }
  };

  const fetchApplicants = async (driveId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/jobs/applicants/${driveId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        triggerNotification(errData.msg || "Error fetching applicants", "error");
        setApplicants([]);
        return;
      }
      const data = await res.json();
      setApplicants(Array.isArray(data) ? data : []);
      setActiveTab('view-applicants');
    } catch {
      triggerNotification("Error fetching applicants", "error");
      setApplicants([]);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/jobs/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newJob)
      });

      if (response.ok) {
        triggerNotification("Drive posted successfully!", "success");
        setNewJob({ job_role: '', ctc_package: '', min_cgpa_required: '', deadline: '' });
        fetchMyJobs();
        setActiveTab('dashboard');
      } else {
        const errData = await response.json().catch(() => ({}));
        triggerNotification(errData.msg || "Failed to publish drive", "error");
      }
    } catch {
      triggerNotification("Connection error", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    window.location.replace('/login');
  };

  if (!loading && !isApproved) {
    return (
      <div style={s.approvalOverlay}>
        <ShieldAlert size={64} color="#f59e0b" style={{ marginBottom: '20px' }} />
        <h2 style={{ color: '#0f172a' }}>Approval Pending</h2>
        <p style={{ color: '#64748b', textAlign: 'center', maxWidth: '400px' }}>
          Your company profile is under review by the TPO Admin.
        </p>
        <button style={{...s.secondaryBtn, marginTop: '20px'}} onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={s.pageWrapper}>
      {notification.show && (
        <div style={{...s.notification, backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444'}}>
          {notification.message}
        </div>
      )}

      <aside style={s.sidebar}>
        <div style={s.logoArea}><div style={s.logoIcon}>P</div><span style={s.logoText}>PlaceNext</span></div>
        <nav style={s.nav}>
          <div onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? {...s.navItem, ...s.navActive} : s.navItem}><LayoutDashboard size={20} /> My Drives</div>
          <div onClick={() => setActiveTab('post-job')} style={activeTab === 'post-job' ? {...s.navItem, ...s.navActive} : s.navItem}><PlusCircle size={20} /> Post New Drive</div>
          <div onClick={fetchAnalytics} style={activeTab === 'analytics' ? {...s.navItem, ...s.navActive} : s.navItem}><BarChart3 size={20} /> Analytics</div>
        </nav>
        <button style={s.logoutBtnSidebar} onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main style={s.mainContent}>
        <header style={s.topHeader}>
          <h1 style={s.welcome}>
            {activeTab === 'view-applicants' ? 'Student Applications' : 
             activeTab === 'analytics' ? 'Company Analytics' : 'Company Console'}
          </h1>
          <button style={s.logoutBtnHeader} onClick={handleLogout}>
            <LogOut size={16}/>
            Logout
          </button>
        </header>

        {activeTab === 'analytics' ? (
          <div style={s.analyticsGrid}>
            <div style={s.statCard}>
              <h3 style={s.statLabel}>Drives Conducted</h3>
              <p style={s.statValue}>{stats.total_jobs}</p>
            </div>
            <div style={s.statCard}>
              <h3 style={s.statLabel}>Total Applicants</h3>
              <p style={s.statValue}>{stats.total_applications}</p>
            </div>
            <div style={s.statCard}>
              <h3 style={s.statLabel}>Shortlisted</h3>
              <p style={{...s.statValue, color: '#10b981'}}>{stats.total_shortlisted}</p>
            </div>
          </div>
        ) : activeTab === 'view-applicants' ? (
          <div style={s.tableContainer}>
             <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Student Name</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>CGPA</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {applicants.length === 0 && (
                  <tr>
                    <td style={s.emptyApplicantsCell} colSpan={5}>
                      No applicants yet for this drive.
                    </td>
                  </tr>
                )}
                {applicants.map((app, index) => (
                  <tr key={app.id || app.application_id || `${app.email || 'app'}-${index}`}>
                    <td style={s.td}>{app.full_name}</td>
                    <td style={s.td}>{app.email}</td>
                    <td style={s.td}>{app.cgpa}</td>
                    <td style={s.td}><span style={s.statusBadge}>{app.status}</span></td>
                    <td style={s.td}><button style={s.viewBtn}>Shortlist</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'post-job' ? (
          <div style={s.card}>
            <h2 style={s.cardTitle}>Add New Placement Drive</h2>
            <form onSubmit={handlePostJob}>
              <div style={s.formGrid}>
                <div style={s.formGroup}>
                  <label style={s.label}>Job Role</label>
                  <input required style={s.inputField} value={newJob.job_role} onChange={(e)=>setNewJob({...newJob, job_role: e.target.value})} placeholder="e.g. Full Stack Developer" />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Package (LPA)</label>
                  <input required type="number" step="0.1" style={s.inputField} value={newJob.ctc_package} onChange={(e)=>setNewJob({...newJob, ctc_package: e.target.value})} placeholder="e.g. 12.5" />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Min CGPA Required</label>
                  <input required type="number" step="0.01" style={s.inputField} value={newJob.min_cgpa_required} onChange={(e)=>setNewJob({...newJob, min_cgpa_required: e.target.value})} placeholder="e.g. 7.5" />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Deadline</label>
                  <input required type="date" style={s.inputField} value={newJob.deadline} onChange={(e)=>setNewJob({...newJob, deadline: e.target.value})} />
                </div>
              </div>
              <button type="submit" style={s.primaryBtn}><Send size={18} /> Publish Drive</button>
            </form>
          </div>
        ) : (
          <div style={s.tableContainer}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Job Role</th>
                  <th style={s.th}>CTC (LPA)</th>
                  <th style={s.th}>Cutoff</th>
                  <th style={s.th}>Deadline</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(drive => (
                  <tr key={drive.drive_id}>
                    <td style={s.td}><strong>{drive.job_role}</strong></td>
                    <td style={s.td}>{drive.ctc_package}</td>
                    <td style={s.td}>{drive.min_cgpa_required}</td>
                    <td style={s.td}>{new Date(drive.deadline).toLocaleDateString()}</td>
                    <td style={s.td}>
                      <button style={s.viewBtn} onClick={() => fetchApplicants(drive.drive_id)}>
                        <Users size={14} /> View Applicants
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  viewBtn: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  statusBadge: { padding: '4px 8px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  pageWrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui' },
  approvalOverlay: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#f8fafc' },
  notification: { position: 'fixed', top: '20px', right: '20px', padding: '15px 25px', color: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  sidebar: { width: '260px', backgroundColor: '#fff', position: 'fixed', height: '100vh', padding: '30px 20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' },
  logoIcon: { backgroundColor: '#0f172a', color: '#fff', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  logoText: { fontSize: '20px', fontWeight: '800', color: '#0f172a' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '12px', color: '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  navActive: { backgroundColor: '#f1f5f9', color: '#0f172a' },
  logoutBtnSidebar: {
    border: '1px solid #fecaca',
    background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    color: '#dc2626',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    borderRadius: '12px',
    marginTop: 'auto',
    transition: 'all 0.2s ease'
  },
  mainContent: { flex: 1, marginLeft: '260px', padding: '40px 50px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' },
  welcome: { fontSize: '28px', fontWeight: '800', margin: 0, color: '#0f172a' },
  card: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' },
  cardTitle: { marginTop: 0, marginBottom: '25px', fontSize: '20px' },
  tableContainer: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px 20px', backgroundColor: '#f8fafc', textAlign: 'left', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' },
  td: { padding: '15px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#1e293b' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#475569' },
  inputField: { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' },
  primaryBtn: { padding: '12px 24px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' },
  secondaryBtn: { padding: '10px 20px', backgroundColor: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center', fontWeight: '600' },
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
  analyticsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  statCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' },
  statLabel: { fontSize: '14px', color: '#64748b', marginBottom: '10px' },
  statValue: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0 },
  emptyApplicantsCell: {
    padding: '24px 20px',
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '600'
  }
};