import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, PlusCircle, LogOut,
  Send, Users, BarChart3, ShieldAlert, MapPin, ChevronLeft, Trash2, Calendar, Briefcase,FileText,CheckCircle2 
} from 'lucide-react';

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [stats, setStats] = useState({ total_jobs: 0, total_applications: 0, total_shortlisted: 0 });
  const [isApproved, setIsApproved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const [newJob, setNewJob] = useState({
    job_role: '',
    ctc_package: '',
    min_cgpa_required: '',
    deadline: '',
    location: ''
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
      if (res.status === 403) { setIsApproved(false); return; }
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
      setIsApproved(true);
    } catch {
      triggerNotification("Failed to fetch job listings", "error");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMyJobs(); }, [fetchMyJobs]);

  const handleDeleteDrive = async (driveId) => {
    if (!window.confirm("Are you sure? This will delete the drive and all student applications permanently.")) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/delete/${driveId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerNotification("Drive deleted successfully", "success");
        setJobs(prev => prev.filter(j => j.drive_id !== driveId));
      } else {
        triggerNotification("Could not delete drive", "error");
      }
    } catch { triggerNotification("Server error during deletion", "error"); }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/jobs/company-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStats({
        total_jobs: Number(data?.total_jobs || 0),
        total_applications: Number(data?.total_applications || 0),
        total_shortlisted: Number(data?.total_shortlisted || 0)
      });
      setActiveTab('analytics');
    } catch { triggerNotification("Could not load analytics", "error"); }
  };

  const fetchApplicants = async (drive) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/jobs/applicants/${drive.drive_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setApplicants(Array.isArray(data) ? data : []);
      setSelectedDrive(drive);
      setActiveTab('view-applicants');
    } catch { triggerNotification("Error fetching applicants", "error"); }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/jobs/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newJob)
      });
      if (response.ok) {
        triggerNotification("Drive posted successfully!", "success");
        setNewJob({ job_role: '', ctc_package: '', min_cgpa_required: '', deadline: '', location: '' });
        fetchMyJobs();
        setActiveTab('dashboard');
      }
    } catch { triggerNotification("Connection error", "error"); }
  };

  const handleShortlistUpdate = async (applicationId, newStatus) => {
    if (!applicationId) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/applications/${applicationId}/shortlist`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        triggerNotification(`Student ${newStatus}!`, "success");
        setApplicants(prev => prev.map(app => 
          (app.id === applicationId || app.application_id === applicationId) 
          ? { ...app, status: newStatus } : app
        ));
      }
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace('/login');
  };

  return (
    <div style={s.pageWrapper}>
      {notification.show && (
        <div style={{ ...s.notification, backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444' }}>
          {notification.message}
        </div>
      )}

      <aside style={s.sidebar}>
         <div style={s.logoArea}>
          <div style={s.logoIcon}>PN</div>
          <div>
            <div style={s.logoText}>PlaceNext</div>
            <div style={s.logoAdmin}>COMPANY PANEL</div>
          </div>
        </div>
        <nav style={s.nav}>
          <div onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? { ...s.navItem, ...s.navActive } : s.navItem}><LayoutDashboard size={20} /> My Drives</div>
          <div onClick={() => {setActiveTab('view-applicants'); setSelectedDrive(null);}} style={activeTab === 'view-applicants' ? { ...s.navItem, ...s.navActive } : s.navItem}><Users size={20} /> View Applicants</div>
          <div onClick={() => setActiveTab('post-job')} style={activeTab === 'post-job' ? { ...s.navItem, ...s.navActive } : s.navItem}><PlusCircle size={20} /> Post New Drive</div>
          <div onClick={fetchAnalytics} style={activeTab === 'analytics' ? { ...s.navItem, ...s.navActive } : s.navItem}><BarChart3 size={20} /> Analytics</div>
        </nav>
      </aside>

      <main style={s.mainContent}>
        <header style={s.topHeader}>
          <h1 style={s.welcome}>
            {activeTab === 'view-applicants' ? (selectedDrive ? `Applicants: ${selectedDrive.job_role}` : 'Drive Directory') : 
             activeTab === 'post-job' ? 'Launch New Drive' : 
             activeTab === 'analytics' ? 'Insights Dashboard' : 'Company HQ'}
          </h1>
          <button style={s.logoutBtnHeader} onClick={handleLogout}><LogOut size={16} /> Logout</button>
        </header>

        {activeTab === 'dashboard' && (
          <div style={s.tableContainer}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Job Role</th>
                  <th style={s.th}>Details</th>
                  <th style={s.th}>Deadline</th>
                  <th style={s.th}>Manage</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(drive => (
                  <tr key={drive.drive_id} style={s.trHover}>
                    <td style={s.td}>
                      <div style={{fontWeight: '700', color: '#0f172a'}}>{drive.job_role}</div>
                      <div style={{fontSize: '12px', color: '#64748b', display:'flex', alignItems:'center', gap:'4px'}}><MapPin size={12}/>{drive.location || 'N/A'}</div>
                    </td>
                    <td style={s.td}>
                      <div style={s.infoRow}><span style={s.badgeLabel}>CTC</span> {drive.ctc_package} LPA</div>
                      <div style={s.infoRow}><span style={s.badgeLabel}>GPA</span> {drive.min_cgpa_required} min</div>
                    </td>
                    <td style={s.td}>
                       <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#dc2626', fontSize:'13px', fontWeight:'600'}}>
                         <Calendar size={14}/> {new Date(drive.deadline).toLocaleDateString()}
                       </div>
                    </td>
                    <td style={s.td}>
                      <div style={{display:'flex', gap:'10px'}}>
                        <button style={s.manageBtn} onClick={() => fetchApplicants(drive)}>Manage</button>
                        <button style={s.deleteBtn} onClick={() => handleDeleteDrive(drive.drive_id)}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'view-applicants' && (
          <>
            {!selectedDrive ? (
              <div style={s.driveSelectionGrid}>
                {jobs.map(drive => (
                  <div key={drive.drive_id} style={s.driveOptionCard} onClick={() => fetchApplicants(drive)}>
                    <div style={s.driveCardIcon}><Briefcase size={24} color="#2563eb" /></div>
                    <div style={{flex:1}}>
                      <h3 style={{margin:0, fontSize:'16px', fontWeight:'700'}}>{drive.job_role}</h3>
                      <p style={{margin:0, fontSize:'13px', color:'#64748b'}}>{drive.location || 'Remote'}</p>
                    </div>
                    <div style={s.arrowBadge}>→</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={s.tableContainer}>
                <div style={s.tableHeaderAction}>
                    <button style={s.backLink} onClick={() => setSelectedDrive(null)}><ChevronLeft size={18}/> Back to Drive List</button>
                    <div style={s.statusPill}>Total: {applicants.length}</div>
                </div>
                <div style={s.tableContainer}>
  <table style={s.table}>
    <thead>
      <tr>
        <th style={s.th}>Student Name</th>
        <th style={s.th}>CGPA</th>
        <th style={s.th}>Resume</th>
        <th style={s.th}>Status</th>
        <th style={s.th}>Action</th>
      </tr>
    </thead>
    <tbody>
      {applicants.length === 0 ? (
        <tr>
          <td colSpan={5} style={s.emptyApplicantsCell}>
            No students have applied yet.
          </td>
        </tr>
      ) : (
        applicants.map((app) => (
          <tr key={app.id || app.application_id} style={s.trHover}>
            <td style={s.td}>
              <div style={{ fontWeight: '600', color: '#0f172a' }}>{app.full_name}</div>
            </td>
            <td style={s.td}>
              <span style={s.cgpaBadge}>{app.cgpa}</span>
            </td>
            
            {/* VIEW RESUME COLUMN */}
            <td style={s.td}>
              {app.resume_url ? (
                <a 
                  href={`http://localhost:5000${app.resume_url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={s.viewResumeLink}
                >
                  <FileText size={16} /> View Resume
                </a>
              ) : (
                <span style={s.noResumeText}>Not Uploaded</span>
              )}
            </td>

            <td style={s.td}>
              <span style={{
                ...s.statusBadge, 
                backgroundColor: app.status === 'shortlisted' ? '#dcfce7' : app.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                color: app.status === 'shortlisted' ? '#166534' : app.status === 'rejected' ? '#991b1b' : '#475569'
              }}>
                {app.status.toUpperCase()}
              </span>
            </td>

            <td style={s.td}>
              {app.status === 'applied' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    style={s.acceptBtn} 
                    onClick={() => handleShortlistUpdate(app.id || app.application_id, 'shortlisted')}
                  >
                    Shortlist
                  </button>
                  <button 
                    style={s.rejectBtnAction} 
                    onClick={() => handleShortlistUpdate(app.id || app.application_id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <div style={s.processedText}>
                  <CheckCircle2 size={14} /> DECISION MADE
                </div>
              )}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
              </div>
            )}
          </>
        )}

        {activeTab === 'post-job' && (
          <div style={s.card}>
            <form onSubmit={handlePostJob}>
              <div style={s.formGrid}>
                <div style={s.formGroup}>
                  <label style={s.label}>Job Role</label>
                  <input required style={s.inputField} value={newJob.job_role} onChange={e => setNewJob({...newJob, job_role: e.target.value})} placeholder="e.g. Senior Product Designer" />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Work Location</label>
                  <input required style={s.inputField} value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} placeholder="e.g. Pune (Office) / Remote" />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>CTC (Annual LPA)</label>
                  <input required type="number" step="0.1" style={s.inputField} value={newJob.ctc_package} onChange={e => setNewJob({...newJob, ctc_package: e.target.value})} />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Min CGPA Requirement</label>
                  <input required type="number" step="0.01" style={s.inputField} value={newJob.min_cgpa_required} onChange={e => setNewJob({...newJob, min_cgpa_required: e.target.value})} />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Application Deadline</label>
                  <input required type="date" style={s.inputField} value={newJob.deadline} onChange={e => setNewJob({...newJob, deadline: e.target.value})} />
                </div>
              </div>
              <button type="submit" style={s.primaryBtn}><Send size={18} /> Publish to Placement Portal</button>
            </form>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={s.analyticsGrid}>
            <div style={s.statCard}><h3 style={s.statLabel}>Active Drives</h3><p style={s.statValue}>{stats.total_jobs}</p></div>
            <div style={s.statCard}><h3 style={s.statLabel}>Applications</h3><p style={s.statValue}>{stats.total_applications}</p></div>
            <div style={s.statCard}><h3 style={s.statLabel}>Hired/Shortlisted</h3><p style={{...s.statValue, color:'#10b981'}}>{stats.total_shortlisted}</p></div>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  // Enhanced Button Styles
  manageBtn: { padding: '8px 16px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: '0.2s' },
  deleteBtn: { padding: '8px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '10px', cursor: 'pointer', transition: '0.2s' },
  acceptBtn: { padding: '8px 14px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' },
  rejectBtnAction: { padding: '8px 14px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' },
  
  // Grid & Layout Enhancements
  driveSelectionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  driveOptionCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '18px', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  driveCardIcon: { backgroundColor: '#eff6ff', padding: '12px', borderRadius: '12px' },
  arrowBadge: { backgroundColor: '#f8fafc', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 'bold' },
  
  // Dashboard Table Extras
  badgeLabel: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginRight: '5px' },
  infoRow: { fontSize: '13px', display: 'flex', alignItems: 'center', marginBottom: '4px' },
  tableHeaderAction: { padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: { backgroundColor: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#475569' },
  
  // Core Page Styling
  pageWrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Plus Jakarta Sans", sans-serif' },
  sidebar: { width: '280px', backgroundColor: '#fff', position: 'fixed', height: '100vh', padding: '40px 24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' },
  logoIcon: { backgroundColor: '#2563eb', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px' },
  logoText: { fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' },
    logoAdmin: { fontSize: '10px', color: '#3b82f6', fontWeight: '900', letterSpacing: '1px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '14px', color: '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  navActive: { backgroundColor: '#eff6ff', color: '#2563eb' },
  mainContent: { flex: 1, marginLeft: '280px', padding: '48px 60px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '48px', alignItems: 'center' },
  welcome: { fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-1px' },
  card: { backgroundColor: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' },
  // tableContainer: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  // table: { width: '100%', borderCollapse: 'collapse' },
  // th: { padding: '18px 24px', backgroundColor: '#f8fafc', textAlign: 'left', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' },
  // td: { padding: '20px 24px', borderBottom: '1px solid #f8fafc', fontSize: '14px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '14px', fontWeight: '700', color: '#1e293b' },
  inputField: { padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', transition: '0.2s', ':focus': { borderColor: '#2563eb' } },
  primaryBtn: { padding: '16px 32px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' },
  statusBadge: { padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' },
  notification: { position: 'fixed', top: '30px', right: '30px', padding: '16px 32px', color: '#fff', borderRadius: '16px', zIndex: 1000, fontWeight: '700', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  analyticsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' },
  statCard: { backgroundColor: '#fff', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', textAlign: 'left' },
  statLabel: { fontSize: '14px', color: '#64748b', fontWeight: '700', marginBottom: '8px' },
  statValue: { fontSize: '40px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  backLink: { background: 'none', border: 'none', color: '#2563eb', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  logoutBtnHeader: { padding: '10px 20px', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '13px' },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    marginTop: '20px'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '16px',
    backgroundColor: '#f8fafc',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e2e8f0'
  },
  td: { padding: '16px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  viewResumeLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '700',
    transition: 'all 0.2s ease',
    border: '1px solid #dbeafe'
  },
  cgpaBadge: {
    backgroundColor: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: '700',
    color: '#475569'
  },
  noResumeText: { color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' },
  processedText: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#94a3b8'
  }
};