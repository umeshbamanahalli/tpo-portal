import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BarChart3, LogOut, FileText, Search, Building2,
  Mail, Trash2, Download, CheckCircle, Clock, Filter, ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBranch, setActiveBranch] = useState("All");
  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [students, setStudents] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const branches = ["All", "CSE", "IT", "Mechanical", "Civil", "ENTC"];

  const triggerNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const fetchInitialData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = '/login';
    
    setLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      const [pRes, cRes, sRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/tracking', config),
        fetch('http://localhost:5000/api/admin/companies', config),
        fetch('http://localhost:5000/api/admin/students', config)
      ]);

      const [pData, cData, sData] = await Promise.all([pRes.json(), cRes.json(), sRes.json()]);

      setPlacements(Array.isArray(pData) ? pData : []);
      setCompanies(Array.isArray(cData) ? cData : []);
      setStudents(Array.isArray(sData) ? sData : []);
    } catch (err) {
      console.error("Fetch error:", err);
      triggerNotification("Failed to synchronize data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  // --- Logic Handlers ---
  const handleApproveCompany = async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/companies/${id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        triggerNotification(`Company ${status} successfully`, "success");
        fetchInitialData();
      }
    } catch (err) { 
      triggerNotification("Update failed", "error");
    }
  };

  // Add this inside your AdminDashboard component
const handleDeleteStudent = async (studentId) => {
  if (!window.confirm("Are you sure you want to permanently delete this student record?")) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`http://localhost:5000/api/admin/delete-student/${studentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      // Update the local state to remove the student from the UI
      setStudents(prev => prev.filter(s => s.id !== studentId));
      triggerNotification("Student deleted successfully", "success");
    } else {
      const errorData = await res.json();
      triggerNotification(errorData.msg || "Failed to delete student", "error");
    }
  } catch (err) {
    triggerNotification("Network error", "error");
  }
};

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm("Warning: Deleting this company will remove all their job postings and student applications. Continue?")) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/delete-company/${companyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setCompanies(prev => prev.filter(c => c.company_id !== companyId));
        triggerNotification("Company and associated data removed", "success");
      } else {
        const errorData = await res.json();
        triggerNotification(errorData.msg || "Delete failed", "error");
      }
    } catch (err) {
      triggerNotification("Connection error", "error");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "ID", "Branch", "CGPA"];
    const rows = students.map(s => [s.name, s.email, s.college_id, s.department, s.cgpa]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `Placement_Report_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  // --- Sub-Views ---
  const renderOverview = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={s.statsGrid}>
        <StatCard label="Students Placed" value={placements.filter(p => p.status === 'Placed').length} icon={<CheckCircle color="#10b981"/>} />
        <StatCard label="Pending Approval" value={companies.filter(c => c.status === 'pending').length} icon={<Clock color="#f59e0b"/>} />
        <StatCard label="Total Talent Pool" value={students.length} icon={<Users color="#3b82f6"/>} />
      </div>

      <div style={s.tableContainer}>
        <div style={s.tableHeader}>
          <h3 style={s.tableTitle}>Live Placement Feed</h3>
          <span style={s.livePulse}>● Live</span>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Candidate</th>
              <th style={s.th}>Organization</th>
              <th style={s.th}>Package</th>
              <th style={s.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {placements.slice(0, 8).map((p, i) => (
              <tr key={i} style={s.tr}>
                <td style={s.td}><span style={s.boldText}>{p.full_name}</span></td>
                <td style={s.td}>{p.company_name}</td>
                <td style={s.td}>{p.ctc_package||"N/A"} LPA</td>
                <td style={s.td}>
                   <span style={{...s.statusBadge, 
                      backgroundColor: p.status === 'Placed' ? '#dcfce7' : '#eff6ff', 
                      color: p.status === 'Placed' ? '#166534' : '#1e40af'}}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const renderStudents = () => {
    const filtered = students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBranch = activeBranch === "All" || s.department === activeBranch;
      return matchSearch && matchBranch;
    });

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={s.controlsRow}>
          <div style={s.tabGroup}>
            {branches.map(b => (
              <button key={b} onClick={() => setActiveBranch(b)} style={activeBranch === b ? s.activeBranchTab : s.branchTab}>{b}</button>
            ))}
          </div>
          <button style={s.exportBtn} onClick={handleExportCSV}><Download size={16}/> Download Report</button>
        </div>

        <div style={s.tableContainer}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Student Profile</th>
                <th style={s.th}>University ID</th>
                <th style={s.th}>Branch</th>
                <th style={s.th}>CGPA</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(st => (
                <tr key={st.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.studentInfo}>
                      <div style={s.avatar}>{st.name.charAt(0)}</div>
                      <div>
                        <div style={s.boldText}>{st.name}</div>
                        <div style={s.subText}>{st.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}><code style={s.idBadge}>{st.college_id}</code></td>
                  <td style={s.td}><span style={s.branchBadge}>{st.department}</span></td>
                  <td style={s.td}><span style={s.cgpaText}>{st.cgpa}</span></td>
                  <td style={s.td}>
                    <div style={{display: 'flex', gap: '12px'}}>
                      <Mail size={18} style={s.iconBtn} color="#94a3b8" />
                      <Trash2 onClick={()=>handleDeleteStudent(st.id)} size={18} style={s.iconBtn} color="#ef4444" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  return (
    <div style={s.pageWrapper}>
      <AnimatePresence>
        {notification.show && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              ...s.notification, 
              backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444' 
            }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <aside style={s.sidebar}>
        <div style={s.logoArea}>
          <div style={s.logoIcon}>PN</div>
          <div>
            <div style={s.logoText}>PlaceNext</div>
            <div style={s.logoAdmin}>ADMIN PANEL</div>
          </div>
        </div>

        <nav style={s.nav}>
          <NavItem active={activeTab === 'overview'} icon={<BarChart3 size={20}/>} label="Overview" onClick={() => setActiveTab('overview')} />
          <NavItem active={activeTab === 'companies'} icon={<Building2 size={20}/>} label="Corporate Partners" onClick={() => setActiveTab('companies')} />
          <NavItem active={activeTab === 'students'} icon={<Users size={20}/>} label="Student Records" onClick={() => setActiveTab('students')} />
        </nav>

        <button style={s.logoutBtn} onClick={() => { localStorage.clear(); window.location.href='/login'; }}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      <main style={s.mainContent}>
        <header style={s.topHeader}>
          <div>
            <h1 style={s.pageTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p style={s.subText}>Manage your institution's placement ecosystem</p>
          </div>
          <div style={s.searchContainer}>
            <Search size={18} color="#94a3b8" />
            <input style={s.searchInput} placeholder="Quick search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </header>

        {loading ? (
          <div style={s.loadingArea}><div className="spinner"></div> Synchronizing Data...</div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'students' && renderStudents()}
            {activeTab === 'companies' && (
               <div style={s.tableContainer}>
                <div style={s.tableHeader}><h3 style={s.tableTitle}>Partner Companies</h3></div>
                <table style={s.table}>
                    <thead>
                        <tr>
                            <th style={s.th}>Organization</th>
                            <th style={s.th}>Contact Email</th>
                            <th style={s.th}>Verification</th>
                            <th style={s.th}>Management</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map(c => (
                            <tr key={c.company_id} style={s.tr}>
                                <td style={s.td}><span style={s.boldText}>{c.company_name}</span></td>
                                <td style={s.td}>{c.email}</td>
                                <td style={s.td}>
                                    <span style={{...s.statusBadge, 
                                        backgroundColor: c.status === 'approved' ? '#dcfce7' : '#fef3c7', 
                                        color: c.status === 'approved' ? '#166534' : '#92400e'}}>
                                        {c.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={s.td}>
                                    <div style={{display:'flex', gap:'8px'}}>
                                        {c.status === 'pending' && (
                                            <button onClick={() => handleApproveCompany(c.company_id, 'approved')} style={s.approveBtn}>Verify</button>
                                        )}
                                        <button 
                                          style={s.deleteBtn} 
                                          onClick={() => handleDeleteCompany(c.company_id)}
                                          title="Remove Company"
                                        >
                                          <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
               </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const NavItem = ({ active, icon, label, onClick }) => (
  <div onClick={onClick} style={active ? {...s.navItem, ...s.navActive} : s.navItem}>
    {icon} {label}
  </div>
);

const StatCard = ({ label, value, icon }) => (
  <div style={s.card}>
    <div style={s.cardIconArea}>{icon}</div>
    <div>
      <p style={s.cardLabel}>{label}</p>
      <h2 style={s.cardValue}>{value || '0'}</h2>
    </div>
  </div>
);

const s = {
  pageWrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', color: '#1e293b' },
  sidebar: { width: '280px', backgroundColor: '#fff', position: 'fixed', height: '100vh', padding: '40px 24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '50px' },
  logoIcon: { backgroundColor: '#2563eb', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' },
  logoText: { fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' },
  logoAdmin: { fontSize: '10px', color: '#3b82f6', fontWeight: '900', letterSpacing: '1px' },
  
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '14px', color: '#64748b', fontWeight: '600', cursor: 'pointer', transition: '0.2s' },
  navActive: { backgroundColor: '#eff6ff', color: '#2563eb' },
  logoutBtn: { padding: '14px', borderRadius: '14px', backgroundColor: '#fff1f2', color: '#dc2626', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },

  mainContent: { flex: 1, marginLeft: '280px', padding: '60px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' },
  pageTitle: { fontSize: '32px', fontWeight: '900', margin: 0 },
  subText: { color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' },
  searchContainer: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fff', padding: '12px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', width: '320px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' },
  card: { backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  cardIconArea: { width: '50px', height: '50px', borderRadius: '16px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: '13px', color: '#64748b', fontWeight: '700', margin: 0 },
  cardValue: { fontSize: '28px', fontWeight: '900', margin: '2px 0 0 0' },

  tableContainer: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' },
  tableHeader: { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableTitle: { fontSize: '18px', fontWeight: '800', margin: 0 },
  livePulse: { fontSize: '12px', fontWeight: '800', color: '#10b981', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 24px', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' },
  tr: { transition: '0.2s', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '20px 24px', fontSize: '14px' },
  boldText: { fontWeight: '700', color: '#1e293b' },
  statusBadge: { padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' },

  controlsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  tabGroup: { display: 'flex', gap: '8px', backgroundColor: '#e2e8f0', padding: '6px', borderRadius: '16px' },
  branchTab: { padding: '8px 20px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: '700', cursor: 'pointer' },
  activeBranchTab: { padding: '8px 20px', borderRadius: '12px', border: 'none', background: '#fff', color: '#2563eb', fontWeight: '800', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  exportBtn: { backgroundColor: '#1e293b', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  
  studentInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' },
  idBadge: { backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' },
  branchBadge: { backgroundColor: '#f0f9ff', color: '#0369a1', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' },
  cgpaText: { color: '#2563eb', fontWeight: '900' },
  iconBtn: { cursor: 'pointer', transition: '0.2s' },
  approveBtn: { backgroundColor: '#dcfce7', color: '#166534', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer', transition: '0.2s' },
  loadingArea: { textAlign: 'center', padding: '100px 0', color: '#64748b', fontWeight: '700' },
  notification: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', color: '#fff', borderRadius: '16px', zIndex: 1000, fontWeight: '700', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
};