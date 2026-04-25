import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, LayoutDashboard, LogOut, FileText, CheckCircle2, 
  AlertCircle, RefreshCcw, UserCircle, GraduationCap, 
  MapPin, Upload, ChevronRight, X, Clock, Bell, BookOpen, Layers, Award, Video, Code, Brain, Mail, UploadCloud
} from 'lucide-react';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [student, setStudent] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeType, setActiveType] = useState('All');
  const [activeAppType, setActiveAppType] = useState('All');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [newCert, setNewCert] = useState({
    cert_name: '',
    issuing_org: '',
    issue_date: '',
    cert_url: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [profileRes, drivesRes, appRes, notifyRes, certRes, trainRes] = await Promise.all([
        axios.get('http://localhost:5000/api/student/profile', config),
        axios.get('http://localhost:5000/api/student/drives', config),
        axios.get('http://localhost:5000/api/student/my-applications', config),
        axios.get('http://localhost:5000/api/student/notifications', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:5000/api/student/certifications', config),
        axios.get('http://localhost:5000/api/student/training', config).catch(() => ({ data: [] }))
      ]);
      setStudent(profileRes.data);
      setJobs(Array.isArray(drivesRes.data) ? drivesRes.data : []);
      setApplications(Array.isArray(appRes.data) ? appRes.data : []);
      setNotifications(Array.isArray(notifyRes.data) ? notifyRes.data : []);
      setCertifications(certRes.data);
      setTrainingSessions(trainRes.data);
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
  // Check if student has uploaded a resume
  if (!student?.resume_url) {
    alert(" Resume Required: Please upload your resume in the 'My Profile' tab before applying.");
    setActiveTab('profile'); // Automatically redirect them to the profile update page
    return;
  }

  setLoading(true); // Show loader or disable button while applying
  try {
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/student/apply', 
      { drive_id: driveId }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await fetchData(); // Wait for data to sync before alerting
    alert("✅ Application successful!");
  } catch (err) { 
    alert(err.response?.data?.msg || "Apply failed"); 
  } finally {
    setLoading(false);
  }
};

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('full_name', student.full_name);
      formData.append('department', student.department);
      formData.append('cgpa', student.cgpa);
      formData.append('intake_type', student.intake_type);
      if (selectedFile) formData.append('resume', selectedFile);

      await axios.put('http://localhost:5000/api/student/update-profile', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      fetchData();
      setActiveTab('dashboard');
    } catch (err) { alert("Update failed"); } 
    finally { setLoading(false); }
  };

  const handleAddCert = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/student/certifications', newCert, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCert({ cert_name: '', issuing_org: '', issue_date: '', cert_url: '' });
      fetchData();
      alert("Certification added successfully!");
    } catch (err) { alert("Failed to add certification"); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={s.loaderContainer}><RefreshCcw className="animate-spin" size={40} color="#3b82f6" /></div>;

  return (
    <div style={{...s.pageWrapper, flexDirection: isMobile ? 'column' : 'row'}}>
      
      {/* --- Navigation --- */}
      {!isMobile ? (
        <aside style={s.sidebar}>
 <div style={s.logoArea}>
          <div style={s.logoIcon}>PN</div>
          <div>
            <div style={s.logoText}>PlaceNext</div>
            <div style={s.logoAdmin}>STUDENT PANEL</div>
          </div>
        </div>         
         <nav style={s.nav}>
            <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
            <NavItem active={activeTab === 'applied'} icon={<Briefcase size={20}/>} label="Applications" onClick={() => setActiveTab('applied')} />
            <NavItem active={activeTab === 'training'} icon={<Video size={20}/>} label="Training" onClick={() => setActiveTab('training')} />
            <NavItem active={activeTab === 'practice'} icon={<Code size={20}/>} label="Practice" onClick={() => setActiveTab('practice')} />
            <NavItem active={activeTab === 'certifications'} icon={<Award size={20}/>} label="Certifications" onClick={() => setActiveTab('certifications')} />
            <NavItem active={activeTab === 'profile'} icon={<UserCircle size={20}/>} label="My Profile" onClick={() => setActiveTab('profile')} />
          </nav>
          <button style={s.logoutBtn} onClick={() => { localStorage.clear(); window.location.href = '/login'; }}><LogOut size={18} /> Logout</button>
        </aside>
      ) : (
        <nav style={s.bottomNav}>
          <div style={{...s.navItemMobile, color: activeTab === 'dashboard' ? '#3b82f6' : '#94a3b8'}} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={24} /><span style={s.navLabelMobile}>Home</span></div>
          <div style={{...s.navItemMobile, color: activeTab === 'applied' ? '#3b82f6' : '#94a3b8'}} onClick={() => setActiveTab('applied')}><Briefcase size={24} /><span style={s.navLabelMobile}>Applied</span></div>
          <div style={{...s.navItemMobile, color: activeTab === 'training' ? '#3b82f6' : '#94a3b8'}} onClick={() => setActiveTab('training')}><Video size={24} /><span style={s.navLabelMobile}>Training</span></div>
          <div style={{...s.navItemMobile, color: activeTab === 'practice' ? '#3b82f6' : '#94a3b8'}} onClick={() => setActiveTab('practice')}><Code size={24} /><span style={s.navLabelMobile}>Practice</span></div>
          <div style={{...s.navItemMobile, color: activeTab === 'certifications' ? '#3b82f6' : '#94a3b8'}} onClick={() => setActiveTab('certifications')}><Award size={24} /><span style={s.navLabelMobile}>Certs</span></div>
          <div style={{...s.navItemMobile, color: activeTab === 'profile' ? '#3b82f6' : '#94a3b8'}} onClick={() => setActiveTab('profile')}><UserCircle size={24} /><span style={s.navLabelMobile}>Profile</span></div>
          <div style={{...s.navItemMobile, color: '#ef4444'}} onClick={() => { localStorage.clear(); window.location.href = '/login'; }}><LogOut size={24} /><span style={s.navLabelMobile}>Exit</span></div>
        </nav>
      )}

      {/* --- Main Content --- */}
      <main style={{...s.mainContent, marginLeft: isMobile ? 0 : '280px', padding: isMobile ? '20px' : '40px 60px', paddingBottom: isMobile ? '100px' : '40px', position: 'relative'}}>
        <header style={s.topHeader}>
          <div style={s.flexBetween}>
            <div>
              <h1 style={{...s.welcome, fontSize: isMobile ? '24px' : '32px'}}>Hello, {student?.full_name?.split(' ')[0]}!</h1>
              <p style={s.dateText}>{student?.college_id} • {student?.department}</p>
            </div>
            <div style={s.headerActions}>
              <button style={s.notificationIcon} onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={24} />
                {notifications.some(n => !n.is_read) && <span style={s.notifyDot}></span>}
              </button>
            </div>
          </div>
        </header>

        {/* Notifications Dropdown */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={s.notificationDropdown}>
              <div style={s.flexBetween}><h4 style={{margin:0}}>Recent Updates</h4><X size={18} style={{cursor:'pointer'}} onClick={() => setShowNotifications(false)}/></div>
              <div style={s.notifyList}>
                {notifications.length > 0 ? notifications.map(n => (
                  <div key={n.notification_id} style={s.notifyItem}>{n.message}</div>
                )) : <p style={s.emptyText}>No new notifications</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

              <div style={s.filterSection}>
                <h2 style={s.gridTitle}>Eligible Opportunities</h2>
                <div style={s.filterContainer}>
                  {['All', 'Placement', 'Internship', 'Training'].map(type => (
                    <button key={type} onClick={() => setActiveType(type)} style={activeType === type ? s.filterActive : s.filterBtn}>{type}</button>
                  ))}
                </div>
              </div>

              <div style={s.jobGrid}>
                {jobs
                  .filter(job => activeType === 'All' || job.opportunity_type === activeType)
                  .map(job => (
                    <JobCard key={job.drive_id} job={job} onApply={handleApply} hasApplied={applications.some(app => app.drive_id === job.drive_id)} isEligible={parseFloat(student?.cgpa) >= parseFloat(job.min_cgpa_required)} hasResume={!!student?.resume_url}/>
                  ))}
              </div>
            </motion.div>
          )}

          {/* TAB 2: APPLICATIONS */}
      {activeTab === 'applied' && (
  <motion.div key="app" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
    <div style={s.filterSection}>
      <h2 style={s.gridTitle}>My Career Journey</h2>
      <div style={s.filterContainer}>
        {['All', 'Placement', 'Internship', 'Training'].map(type => (
          <button key={type} onClick={() => setActiveAppType(type)} style={activeAppType === type ? s.filterActive : s.filterBtn}>{type}</button>
        ))}
      </div>
    </div>

    <div style={s.jobGrid}>
      {applications
        .filter(app => activeAppType === 'All' || app.opportunity_type === activeAppType)
        .length > 0 ? applications
          .filter(app => activeAppType === 'All' || app.opportunity_type === activeAppType)
          .map(app => {
            const status = app.overall_status?.toLowerCase();
            let statusStyles = { bg: '#f1f5f9', text: '#475569' }; 

            if (status === 'shortlisted' || status === 'selected') {
              statusStyles = { bg: '#dcfce7', text: '#166534' };
            } else if (status === 'rejected') {
              statusStyles = { bg: '#fee2e2', text: '#991b1b' };
            } else if (status === 'applied') {
              statusStyles = { bg: '#eff6ff', text: '#3b82f6' };
            }

            return (
              <div key={app.application_id} style={s.jobCard}>
                <div style={s.jobTop}>
                  <div>
                    <span style={s.jobRole}>{app.job_role}</span>
                    <div style={{marginTop: '4px'}}>
                      <span style={s.typeTag}>{app.opportunity_type}</span>
                    </div>
                  </div>
                  <span style={{
                    ...s.statusBadge, 
                    backgroundColor: statusStyles.bg, 
                    color: statusStyles.text,
                    textTransform: 'capitalize',
                    height: 'fit-content'
                  }}>
                    {app.overall_status}
                  </span>
                </div>

                <p style={s.companyInfo}><MapPin size={14} /> {app.company_name} • <span style={s.categoryTag}>{app.company_category}</span></p>
                
                <div style={{...s.infoItem, marginBottom: '15px', color: '#2563eb'}}>
                  <Briefcase size={14} /> <b>{app.ctc_package} {app.opportunity_type === 'Internship' ? 'Stipend' : 'LPA'}</b>
                </div>

                {app.current_round && (
                  <div style={s.roundIndicator}><Layers size={14}/> Current Stage: <b>{app.current_round}</b></div>
                )}

            <div style={s.detailRow}>
              <span>Applied On:</span> 
              <b>{new Date(app.applied_at).toLocaleDateString()}</b>
            </div>
          </div>
        );
      }) : <p style={s.emptyText}>No applications yet. Start applying!</p>}
    </div>
  </motion.div>
)}

          {/* TAB: PRACTICE ARENA */}
          {activeTab === 'practice' && (
            <motion.div key="practice" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div style={s.flexBetween}>
                <h2 style={s.gridTitle}>Placement Practice Arena</h2>
                <div style={s.linkBox}>Level: Advanced</div>
              </div>
              
              <div style={s.practiceGrid}>
                <PracticeCard 
                  icon={<Code size={24} color="#3b82f6"/>} 
                  title="Coding Challenges" 
                  desc="Solve Data Structures and Algorithms problems curated for product companies." 
                  links={[{ name: "LeetCode", url: "https://leetcode.com" }, { name: "HackerRank", url: "https://hackerrank.com" }]}
                />
                <PracticeCard 
                  icon={<Brain size={24} color="#f59e0b"/>} 
                  title="Aptitude & Logical" 
                  desc="Practice quantitative aptitude, logical reasoning, and verbal ability tests." 
                  links={[{ name: "IndiaBix", url: "https://indiabix.com" }, { name: "GeeksforGeeks", url: "https://geeksforgeeks.org/aptitude-questions-and-answers/" }]}
                />
                <PracticeCard 
                  icon={<UserCircle size={24} color="#10b981"/>} 
                  title="Mock Interviews" 
                  desc="Prepare for HR and Technical rounds with industry-standard question banks." 
                  links={[{ name: "InterviewBit", url: "https://interviewbit.com" }, { name: "Pramp", url: "https://pramp.com" }]}
                />
              </div>

              <div style={{...s.profileCard, marginTop: '30px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff'}}>
                <h3 style={{...s.cardHeading, color: '#fff'}}>🚀 AI Mock Assessment (Coming Soon)</h3>
                <p style={{...s.dateText, color: '#94a3b8', marginBottom: '15px'}}>
                  We are building an internal AI-driven mock testing platform tailored to the specific patterns of our partner companies like Google, Infosys, and TCS.
                </p>
                <div style={{display:'flex', gap:'10px'}}>
                  <span style={s.typeTag}>Auto-Grading</span>
                  <span style={s.typeTag}>Role-Specific</span>
                  <span style={s.typeTag}>Time-Bound</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: TRAINING */}
          {activeTab === 'training' && (
            <motion.div key="train" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={s.gridTitle}>Upskilling & Training Sessions</h2>
              <div style={s.jobGrid}>
                {trainingSessions.length > 0 ? trainingSessions.map(session => (
                  <div key={session.session_id} style={s.jobCard}>
                    <div style={s.jobTop}>
                      <span style={s.jobRole}>{session.title}</span>
                    </div>
                    <p style={s.companyInfo}><UserCircle size={14} /> Trainer: {session.trainer_name}</p>
                    <div style={s.detailRow}>
                      <span>Schedule:</span> 
                      <b>{new Date(session.start_time).toLocaleString()}</b>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                      {session.meeting_link && (
                        <button 
                          style={{...s.applyButton, flex: 1, backgroundColor: '#3b82f6', minWidth: '120px'}} 
                          onClick={() => window.open(session.meeting_link, '_blank')}
                        >
                          Join Live
                        </button>
                      )}
                      {session.recording_url && (
                        <button 
                          style={{...s.applyButton, flex: 1, backgroundColor: '#0f172a', minWidth: '120px'}} 
                          onClick={() => window.open(session.recording_url, '_blank')}
                        >
                          <Video size={14} /> Watch
                        </button>
                      )}
                    </div>
                    {session.resource_url && (
                      <a 
                        href={session.resource_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{...s.prepLink, marginTop: '12px', justifyContent: 'center'}}
                      >
                        <BookOpen size={14}/> Download Study Material
                      </a>
                    )}
                  </div>
                )) : <p style={s.emptyText}>No training sessions scheduled for your department.</p>}
              </div>
            </motion.div>
          )}

          {/* TAB: CERTIFICATIONS */}
          {activeTab === 'certifications' && (
            <motion.div key="cert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={s.profileCard}>
                <h2 style={{...s.gridTitle, marginBottom: '20px'}}>Add New Certification</h2>
                <div style={{...s.formGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'}}>
                  <div style={s.formGroup}><label style={s.label}>Certificate Name</label><input style={s.inputField} value={newCert.cert_name} onChange={e => setNewCert({...newCert, cert_name: e.target.value})} placeholder="e.g. AWS Solutions Architect" /></div>
                  <div style={s.formGroup}><label style={s.label}>Issuing Organization</label><input style={s.inputField} value={newCert.issuing_org} onChange={e => setNewCert({...newCert, issuing_org: e.target.value})} placeholder="e.g. Amazon Web Services" /></div>
                  <div style={s.formGroup}><label style={s.label}>Issue Date</label><input style={s.inputField} type="date" value={newCert.issue_date} onChange={e => setNewCert({...newCert, issue_date: e.target.value})} /></div>
                  <div style={s.formGroup}><label style={s.label}>Credential URL</label><input style={s.inputField} value={newCert.cert_url} onChange={e => setNewCert({...newCert, cert_url: e.target.value})} placeholder="https://..." /></div>
                </div>
                <button style={{...s.applyButton, marginTop: '20px', maxWidth: '200px'}} onClick={handleAddCert}>Add Certification</button>
              </div>

              <div style={{marginTop: '40px'}}>
                <h2 style={s.gridTitle}>My Certifications</h2>
                <div style={s.jobGrid}>
                  {certifications.length > 0 ? certifications.map(cert => (
                    <div key={cert.cert_id} style={s.jobCard}>
                      <div style={s.jobTop}>
                        <span style={s.jobRole}>{cert.cert_name}</span>
                        <Award size={20} color="#3b82f6" />
                      </div>
                      <p style={s.companyInfo}>{cert.issuing_org}</p>
                      <div style={s.detailRow}>
                        <span>Issued:</span> 
                        <b>{cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : 'N/A'}</b>
                      </div>
                      {cert.cert_url && (
                        <a href={cert.cert_url} target="_blank" rel="noreferrer" style={s.prepLink}>
                          <BookOpen size={14}/> View Certificate
                        </a>
                      )}
                    </div>
                  )) : <p style={s.emptyText}>No certifications added yet.</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: PROFILE */}
          {activeTab === 'profile' && (
            <motion.div key="prof" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={s.profileCard}>
              <div style={s.profileHeader}>
                <div style={s.avatarBig}>{student?.full_name?.charAt(0)}</div>
                <div>
                  <h2 style={{...s.welcome, fontSize: '28px'}}>{student?.full_name}</h2>
                  <div style={{display:'flex', gap:'15px', color: '#64748b', fontSize:'14px', marginTop: '4px'}}>
                    <span style={{display:'flex', alignItems:'center', gap: '4px'}}><Mail size={14}/> {student?.email}</span>
                    <span style={{display:'flex', alignItems:'center', gap: '4px'}}><GraduationCap size={14}/> {student?.college_id}</span>
                  </div>
                </div>
              </div>

              <div style={s.profileGridMain}>
                <section style={s.formSection}>
                  <h4 style={s.sectionSubtitle}>Personal Details</h4>
                  <div style={s.formGridTwoCol}>
                    <div style={s.formGroup}>
                      <label style={s.label}>Full Name</label>
                      <input style={s.inputField} value={student.full_name} onChange={e => setStudent({...student, full_name: e.target.value})} />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>Department / Branch</label>
                      <input style={s.inputField} value={student.department} onChange={e => setStudent({...student, department: e.target.value})} />
                    </div>
                  </div>
                </section>

                <section style={s.formSection}>
                  <h4 style={s.sectionSubtitle}>Academic Record</h4>
                  <div style={s.formGridTwoCol}>
                    <div style={s.formGroup}>
                      <label style={s.label}>Aggregate CGPA</label>
                      <input style={s.inputField} type="number" step="0.01" value={student.cgpa} onChange={e => setStudent({...student, cgpa: e.target.value})} />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>Admission Type</label>
                      <select style={s.inputField} value={student.intake_type} onChange={e => setStudent({...student, intake_type: e.target.value})}>
                        <option value="Regular">Regular</option>
                        <option value="Lateral">Lateral</option>
                        <option value="Transfer">Transfer</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section style={s.formSection}>
                  <h4 style={s.sectionSubtitle}>Professional Resume</h4>
                  <div style={s.resumeUploadBox}>
                    <div style={s.resumeStatusInfo}>
                      <div style={{...s.logoIcon, backgroundColor: student?.resume_url ? '#dcfce7' : '#fef2f2', color: student?.resume_url ? '#166534' : '#ef4444'}}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <p style={{margin:0, fontWeight:'700', fontSize:'14px'}}>{student?.resume_url ? "Resume is up to date" : "No resume uploaded"}</p>
                        {student?.resume_url && (
                          <a href={`http://localhost:5000${student.resume_url}`} target="_blank" rel="noreferrer" style={{fontSize:'12px', color: '#3b82f6', textDecoration:'underline'}}>View current file</a>
                        )}
                      </div>
                    </div>
                    
                    <div style={s.uploadTriggerWrapper}>
                       <input 
                        type="file" 
                        id="resume-upload" 
                        style={{display:'none'}} 
                        onChange={e => setSelectedFile(e.target.files[0])} 
                       />
                       <label htmlFor="resume-upload" style={s.uploadBtnLabel}>
                         <UploadCloud size={16} />
                         {selectedFile ? selectedFile.name : "Choose New PDF"}
                       </label>
                    </div>
                  </div>
                </section>
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

const PracticeCard = ({ icon, title, desc, links }) => (
  <div style={s.jobCard}>
    <div style={{...s.logoIcon, marginBottom: '15px', width: '40px', display:'flex', justifyContent:'center'}}>{icon}</div>
    <h3 style={s.jobRole}>{title}</h3>
    <p style={{...s.companyInfo, marginBottom: '20px'}}>{desc}</p>
    <div style={{display:'flex', flexWrap: 'wrap', gap: '10px'}}>
      {links.map(link => (
        <a key={link.name} href={link.url} target="_blank" rel="noreferrer" style={{...s.prepLink, margin: 0, padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px'}}>
          {link.name} <ChevronRight size={14}/>
        </a>
      ))}
    </div>
  </div>
);

const JobCard = ({ job, hasApplied, isEligible, hasResume, onApply }) => {
  // Logic to check if the deadline is approaching (within 2 days)
  const isClosingSoon = new Date(job.deadline) - new Date() < 172800000;

  return (
    <div style={s.jobCard}>
      {/* Header with Role and Package */}
      <div style={s.jobTop}>
        <div>
          <div style={s.jobRole}>{job.job_role} <span style={s.typeTag}>{job.opportunity_type}</span></div>
          <div style={s.companyInfo}>
            <Briefcase size={14} /> {job.company_name} • <span style={s.categoryTag}>{job.company_category}</span>
          </div>
        </div>
        <div style={s.jobPackage}>{job.ctc_package} LPA</div>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '15px 0' }} />

      {/* Details Row: Location and Eligibility */}
      <div style={s.detailContainer}>
        <div style={s.infoItem}>
          <MapPin size={14} color="#64748b" />
          <span>{job.location || "On-Campus"}</span>
        </div>
        <div style={s.infoItem}>
          <AlertCircle size={14} color={isEligible ? "#10b981" : "#ef4444"} />
          <span>Min. {job.min_cgpa_required} CGPA</span>
        </div>
      </div>

      {/* Deadline Info */}
      <div style={{...s.infoItem, marginTop: '10px', color: isClosingSoon ? '#ef4444' : '#64748b'}}>
        <Clock size={14} />
        <span style={{fontWeight: isClosingSoon ? '700' : '500'}}>
          Deadline: {new Date(job.deadline).toLocaleDateString()}
        </span>
      </div>

      {job.interview_material_url && (
        <a href={job.interview_material_url} target="_blank" rel="noreferrer" style={s.prepLink}>
          <BookOpen size={14}/> View Interview Guide
        </a>
      )}

      <div style={{ marginTop: '20px' }}>
      {hasApplied ? (
        <div style={s.appliedBadge}>Applied</div>
      ) : !isEligible ? (
        <div style={s.lockedButton}>Criteria Not Met</div>
      ) : !hasResume ? (
        /* If student is eligible but HAS NO RESUME */
        <button 
          style={{...s.applyButton, backgroundColor: '#94a3b8', cursor: 'not-allowed'}} 
          disabled
        >
          Upload Resume to Apply
        </button>
      ) : (
        /* Standard Apply Button */
        <button style={s.applyButton} onClick={() => onApply(job.drive_id)}>
          Apply Now
        </button>
      )}
    </div>
    </div>
  );
};

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
  // jobCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' },
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
    logoAdmin: { fontSize: '10px', color: '#3b82f6', fontWeight: '900', letterSpacing: '1px' },
  logoutBtn: { marginTop: 'auto', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  linkBox: { padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', marginTop: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#475569' },
  cardHeading: { margin: 0, fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  loaderContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  profileCard: { backgroundColor: '#fff', padding: '40px', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid #f1f5f9' },
  avatarBig: { width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900', border: '1px solid #dbeafe' },
  profileGridMain: { display: 'flex', flexDirection: 'column', gap: '32px' },
  formSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionSubtitle: { margin: 0, fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' },
  formGridTwoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
  resumeUploadBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '20px' },
  resumeStatusInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  uploadBtnLabel: { 
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
    backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', 
    fontSize: '13px', fontWeight: '700', color: '#1e293b', cursor: 'pointer',
    transition: 'all 0.2s ease',
    ":hover": { borderColor: '#3b82f6', color: '#3b82f6' }
  },
  uploadTriggerWrapper: { display: 'flex', alignItems: 'center' },
  formGrid: { display: 'grid', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#475569' },
  inputField: { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' },
  detailRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px' },
  emptyText: { color: '#94a3b8', textAlign: 'center', width: '100%', padding: '40px' },
  
  filterSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
  practiceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  filterContainer: { display: 'flex', gap: '8px', backgroundColor: '#fff', padding: '6px', borderRadius: '14px', border: '1px solid #e2e8f0' },
  filterBtn: { border: 'none', background: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#64748b', cursor: 'pointer' },
  filterActive: { border: 'none', background: '#3b82f6', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#fff', cursor: 'pointer' },
  
  headerActions: { display: 'flex', gap: '15px', alignItems: 'center' },
  notificationIcon: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', cursor: 'pointer', position: 'relative', color: '#475569' },
  notifyDot: { position: 'absolute', top: '8px', right: '8px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' },
  notificationDropdown: { position: 'absolute', top: '80px', right: '60px', width: '320px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '20px', zIndex: 100 },
  notifyList: { marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' },
  notifyItem: { padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', fontSize: '13px', color: '#475569', borderLeft: '4px solid #3b82f6' },

  typeTag: { fontSize: '10px', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#f1f5f9', color: '#475569', marginLeft: '8px', verticalAlign: 'middle' },
  categoryTag: { fontWeight: '700', color: '#3b82f6' },
  prepLink: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '15px', fontSize: '13px', color: '#2563eb', fontWeight: '700', textDecoration: 'none' },
  roundIndicator: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '12px', fontSize: '13px', color: '#0369a1', margin: '15px 0' },

  detailContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#475569',
    fontWeight: '500'
  },
  // Update jobCard to have a slight hover effect
  jobCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
    ":hover": {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)'
    }
  }
};