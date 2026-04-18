import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, PlusCircle, BarChart3, 
  LogOut, FileText, Search, Building2
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  // Data States
  const [companies, setCompanies] = useState([]);
  const [placements, setPlacements] = useState([]);
  const fetchInitialData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      if (activeTab === 'overview') {
        const res = await fetch('http://localhost:5000/api/admin/tracking', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setPlacements(Array.isArray(data) ? data : []);
      } else if (activeTab === 'companies') {
        const res = await fetch('http://localhost:5000/api/admin/companies', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : []);
      }
      // Add similar fetch calls for students...
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, [activeTab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitialData();
  }, [fetchInitialData]);

  const handleApproveCompany = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/admin/approve-company/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchInitialData();
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // --- Sub-Views ---

  const renderOverviewView = () => (
    <>
      <div style={s.statsGrid}>
        <div style={s.card}>
          <p style={s.cardLabel}>Total Placed</p>
          <h2 style={s.cardValue}>42</h2>
        </div>
        <div style={{...s.card, borderLeft: '4px solid #10b981'}}>
          <p style={s.cardLabel}>Pending Approvals</p>
          <h2 style={s.cardValue}>{companies.filter(c => c.status === 'pending').length}</h2>
        </div>
        <div style={{...s.card, borderLeft: '4px solid #3b82f6'}}>
          <p style={s.cardLabel}>Live Jobs</p>
          <h2 style={s.cardValue}>8</h2>
        </div>
      </div>

      <div style={s.tableContainer}>
        <div style={s.tableHeader}>
          <h3 style={{margin: 0}}>Real-time Placement Tracking</h3>
          <button style={s.actionBtn}><FileText size={16}/> Export Report</button>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Student</th>
              <th style={s.th}>Company</th>
              <th style={s.th}>Role</th>
              <th style={s.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((p, idx) => (
              <tr key={idx}>
                <td style={s.td}>{p.full_name}</td>
                <td style={s.td}>{p.company_name}</td>
                <td style={s.td}>{p.role}</td>
                <td style={s.td}><span style={{...s.statusBadge, backgroundColor: p.status === 'Placed' ? '#dcfce7' : '#eff6ff'}}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderCompaniesView = () => (
    <div style={s.tableContainer}>
      <div style={s.tableHeader}><h3>Company Management</h3></div>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Company</th>
            <th style={s.th}>HR Email</th>
            <th style={s.th}>Status</th>
            <th style={s.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {companies.map(c => (
            <tr key={c.company_id}>
              <td style={s.td}><strong>{c.company_name}</strong></td>
              <td style={s.td}>{c.email}</td>
              <td style={s.td}>
                <span style={{...s.statusBadge, backgroundColor: c.status === 'approved' ? '#dcfce7' : '#fef3c7'}}>
                  {c.status}
                </span>
              </td>
              <td style={s.td}>
                {c.status === 'pending' && (
                  <button onClick={() => handleApproveCompany(c.company_id)} style={s.approveBtn}>Approve</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={s.pageWrapper}>
      <aside style={s.sidebar}>
        <div style={s.logoArea}>
          <div style={s.logoIcon}>P</div>
          <div style={s.logoTextGroup}>
            <span style={s.logoText}>PlaceNext</span>
            <span style={s.logoSubtext}>TPO ADMIN</span>
          </div>
        </div>
        
        <nav style={s.nav}>
          <div onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? {...s.navItem, ...s.navActive} : s.navItem}>
            <BarChart3 size={20} /> Overview
          </div>
          <div onClick={() => setActiveTab('companies')} style={activeTab === 'companies' ? {...s.navItem, ...s.navActive} : s.navItem}>
            <Building2 size={20} /> Companies
          </div>
          <div onClick={() => setActiveTab('students')} style={activeTab === 'students' ? {...s.navItem, ...s.navActive} : s.navItem}>
            <Users size={20} /> Students
          </div>
          <div onClick={() => setActiveTab('drives')} style={activeTab === 'drives' ? {...s.navItem, ...s.navActive} : s.navItem}>
            <PlusCircle size={20} /> Create Drive
          </div>
        </nav>

        <button style={s.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main style={s.mainContent}>
        <header style={s.topHeader}>
          <h1 style={s.welcome}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div style={s.topActions}>
            <div style={s.searchBar}>
              <Search size={18} color="#94a3b8" />
              <input style={s.searchInput} placeholder="Search anything..." />
            </div>
            <button style={s.logoutBtnHeader} onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {activeTab === 'overview' && renderOverviewView()}
        {activeTab === 'companies' && renderCompaniesView()}
        {/* Placeholder for other views */}
      </main>
    </div>
  );
}

const s = {
  pageWrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' },
  sidebar: { width: '260px', backgroundColor: '#fff', position: 'fixed', height: '100vh', padding: '30px 20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' },
  logoIcon: { backgroundColor: '#1e293b', color: '#fff', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' },
  logoTextGroup: { display: 'flex', flexDirection: 'column' },
  logoText: { fontSize: '20px', fontWeight: '800', color: '#1e293b' },
  logoSubtext: { fontSize: '10px', color: '#64748b', fontWeight: 'bold' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '12px', color: '#64748b', fontWeight: '600', cursor: 'pointer' },
  navActive: { backgroundColor: '#eff6ff', color: '#2563eb' },
  logoutBtn: {
    border: '1px solid #fecaca',
    background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainContent: { flex: 1, marginLeft: '260px', padding: '40px 50px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  welcome: { fontSize: '28px', fontWeight: '800', color: '#1e293b' },
  topActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '300px' },
  searchInput: { border: 'none', outline: 'none', width: '100%' },
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' },
  card: { backgroundColor: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  cardLabel: { fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  cardValue: { fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: '10px 0 0 0' },
  tableContainer: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px 24px', backgroundColor: '#f8fafc', color: '#94a3b8', fontSize: '12px', textAlign: 'left' },
  td: { padding: '18px 24px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  statusBadge: { padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' },
  approveBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  actionBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }
};