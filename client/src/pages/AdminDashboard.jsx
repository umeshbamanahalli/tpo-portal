import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BarChart3, LogOut, FileText, Search, Building2, UploadCloud, BellRing, Sparkles, AlertTriangle,
  Mail, Trash2, Download, CheckCircle, Clock, Filter, ChevronRight, LayoutDashboard, ShieldCheck, UserPlus
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
  
  // New states for analytics (Req 1, 2, 3)
  const [placementStats, setPlacementStats] = useState([]);
  // New states for bulk upload (Req 4)
  const [selectedBulkFile, setSelectedBulkFile] = useState(null);
  const [uploadedDataPreview, setUploadedDataPreview] = useState([]);
  
  // State for visibility modals
  const [viewingEligible, setViewingEligible] = useState(null);
  const [eligibleStudents, setEligibleStudents] = useState([]);

  // New states for company-specific applicants
  const [viewingCompanyApplicants, setViewingCompanyApplicants] = useState(null);
  const [companyApplicantSummary, setCompanyApplicantSummary] = useState({}); // New state for applicant counts
  const [companyApplicants, setCompanyApplicants] = useState([]);

  const [drives, setDrives] = useState([]);

  // Analytics filter states
  const [analyticBranch, setAnalyticBranch] = useState("All");
  const [analyticDivision, setAnalyticDivision] = useState("All");

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

      const [pRes, cRes, sRes, psRes, dRes, appSummaryRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/tracking', config), // Existing
        fetch('http://localhost:5000/api/admin/companies', config), // Existing
        fetch('http://localhost:5000/api/admin/students', config), // Existing
        fetch('http://localhost:5000/api/admin/analytics/placement-stats', config), // New: Req 1, 2, 3
        fetch('http://localhost:5000/api/admin/drives', config), // To see all active drives
        fetch('http://localhost:5000/api/admin/companies/applicant-summary', config) // New: Fetch applicant counts
      ]);

      // Defensive check: Ensure all responses are OK before parsing
      const responses = [pRes, cRes, sRes, psRes, dRes, appSummaryRes]; // Include new response
      const failed = responses.find(r => !r.ok);
      if (failed) {
          const errData = await failed.json().catch(() => ({}));
          throw new Error(errData.msg || errData.error || "Server sync failed");
      }

      const [pData, cData, sData, psData, dData, appSummaryData] = await Promise.all(responses.map(r => r.json()));

      setPlacements(Array.isArray(pData) ? pData : []);
      setCompanies(Array.isArray(cData) ? cData : []);
      setStudents(Array.isArray(sData) ? sData : []);
      setPlacementStats(Array.isArray(psData) ? psData : []);
      setDrives(Array.isArray(dData) ? dData : []);
      
      console.log("Applicant Summary Data:", appSummaryData); // Debugging line
      // Process applicant summary into a map for easy lookup
      const summaryMap = (appSummaryData || []).reduce((acc, item) => {
        acc[item.company_id] = parseInt(item.applicant_count, 10);
        return acc;
      }, {});
      setCompanyApplicantSummary(summaryMap);
    } catch (err) {
      console.error("Fetch error:", err.message);
      triggerNotification(err.message || "Failed to synchronize data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  const fetchEligibleStudents = async (driveId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/drives/${driveId}/eligible`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEligibleStudents(data);
        setViewingEligible(driveId);
      }
    } catch (err) {
      triggerNotification("Failed to fetch eligibility", "error");
    }
  };

  const fetchCompanyApplicants = async (company) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/companies/${company.company_id}/applicants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompanyApplicants(data);
        setViewingCompanyApplicants(company);
      }
    } catch (err) {
      triggerNotification("Failed to fetch company applicants", "error");
    }
  };

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

  // Req 16: Export Placed Students Report
  const handleExportPlacedStudentsCSV = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/admin/reports/placed-students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.length === 0) {
        triggerNotification("No placed students data to export.", "info");
        return;
      }

      const headers = ["Full Name", "College ID", "Department", "Batch", "Company Name", "Job Role", "CTC Package"];
      const rows = data.map(s => [s.full_name, s.college_id, s.department, s.batch, s.company_name, s.job_role, s.ctc_package]);
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `Placed_Students_Report_${new Date().toLocaleDateString()}.csv`;
      link.click();
      triggerNotification("Placed students report exported successfully!", "success");
    } catch (err) {
      console.error("Export error:", err);
      triggerNotification("Failed to export placed students report.", "error");
    }
  };

  // Req 4: Bulk Upload Students
  const handleBulkUpload = async () => {
    if (!selectedBulkFile) {
      triggerNotification("Please select a file to upload.", "error");
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', selectedBulkFile);

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/admin/bulk-upload-students', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadedDataPreview(data.processedData || []);
        triggerNotification(data.msg || "Bulk upload successful.", "success");
        fetchInitialData(); // Refresh all stats, students, and analytics
        setSelectedBulkFile(null); // Clear selected file
      } else {
        // Show the actual error message from the server
        triggerNotification(data.msg || data.error || "Upload failed.", "error");
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      triggerNotification("Network error or invalid file format.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    if (!window.confirm("Generate demo records for testing? This adds sample students and companies.")) return;
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/admin/seed-demo-data', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerNotification(data.msg, "success");
        fetchInitialData();
      }
    } catch (err) { triggerNotification("Seeding failed", "error"); }
    finally { setLoading(false); }
  };

  // --- Sub-Views ---
  const renderOverview = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={s.statsGrid}>
        <StatCard label="Offer Holders" value={placements.filter(p => p.status === 'selected').length} icon={<CheckCircle color="#10b981"/>} />
        <StatCard label="Pending Approval" value={companies.filter(c => c.status === 'pending').length} icon={<Clock color="#f59e0b"/>} />
        <StatCard label="Total Intake" value={placementStats.reduce((a, b) => a + (parseInt(b.total_students) || 0), 0)} icon={<Building2 color="#6366f1"/>} />
        <StatCard label="Talent Pool" value={students.length} icon={<Users color="#3b82f6"/>} />
      </div>

      {/* Req 5, 6: Active Drives & Eligibility Check */}
      <div style={{...s.tableContainer, marginBottom: '32px'}}>
        <div style={s.tableHeader}>
          <h3 style={s.tableTitle}>Active Drives & Category Monitoring</h3>
          <span style={{...s.livePulse, backgroundColor: '#eff6ff', color: '#3b82f6'}}>Drives: {drives.length}</span>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Organization</th>
              <th style={s.th}>Opportunity / Category</th>
              <th style={s.th}>Min CGPA</th>
              <th style={s.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {drives.map(d => (
              <tr key={d.drive_id} style={s.tr}>
                <td style={s.td}><div style={s.boldText}>{d.company_name}</div><div style={s.subText}>{d.job_role}</div></td>
                <td style={s.td}>
                   <div style={s.boldText}>{d.opportunity_type}</div>
                   <div style={s.subText}><span style={s.branchBadge}>{d.company_category}</span></div>
                </td>
                <td style={s.td}><span style={s.cgpaText}>{d.min_cgpa_required}</span></td>
                <td style={s.td}>
                  <button onClick={() => fetchEligibleStudents(d.drive_id)} style={s.outlineBtn}>Check Eligibility</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inline Eligibility View (Req 6) */}
      {viewingEligible && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{...s.bulkCard, marginBottom: '32px', border: '2px solid #3b82f6'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
            <h3 style={s.sectionTitle}>Eligible Candidates ({eligibleStudents.length})</h3>
            <button onClick={() => setViewingEligible(null)} style={{background:'none', border:'none', cursor:'pointer'}}><Trash2 size={20} color="#94a3b8"/></button>
          </div>
          <div style={{maxHeight: '250px', overflowY:'auto'}}>
            <table style={s.table}>
               <thead><tr><th style={s.th}>Name</th><th style={s.th}>Branch</th><th style={s.th}>CGPA</th></tr></thead>
               <tbody>
                 {eligibleStudents.map(st => (
                   <tr key={st.college_id} style={s.tr}><td style={s.td}>{st.full_name}</td><td style={s.td}>{st.department}</td><td style={s.td}>{st.cgpa}</td></tr>
                 ))}
               </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <div style={s.tableContainer}>
        <div style={s.tableHeader}>
          <h3 style={s.tableTitle}>Live Round & Selection Feed</h3>
          <span style={s.livePulse}>● Live</span>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Candidate</th>
              <th style={s.th}>Organization / Role</th>
              <th style={s.th}>Interview Stage</th>
              <th style={s.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {placements.slice(0, 8).map((p, i) => (
              <tr key={i} style={s.tr}>
                <td style={s.td}><div style={s.boldText}>{p.full_name}</div><div style={s.subText}>{p.department}</div></td>
                <td style={s.td}><div style={s.boldText}>{p.company_name}</div><div style={s.subText}>{p.job_role}</div></td>
                <td style={s.td}>
                  <div style={{...s.boldText, color: '#2563eb'}}>
                    {p.current_round ? p.current_round : 'Application Review'}
                  </div>
                </td>
                <td style={s.td}>
                   <span style={{...s.statusBadge, 
                      backgroundColor: p.status === 'selected' ? '#dcfce7' : '#eff6ff', 
                      color: p.status === 'selected' ? '#166534' : '#1e40af'}}>
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
        <div style={{display:'flex', gap: '15px', marginBottom: '30px'}}>
           <div style={s.miniStat}><Users size={16} color="#3b82f6"/> <b>{filtered.length}</b> Students in {activeBranch}</div>
           <div style={s.miniStat}><CheckCircle size={16} color="#10b981"/> <b>{filtered.filter(st => parseFloat(st.cgpa) >= 8).length}</b> Honors (8+ CGPA)</div>
        </div>

        <div style={s.controlsRow}>
          <div style={s.tabGroup}>
            {branches.map(b => (
              <button key={b} onClick={() => setActiveBranch(b)} style={activeBranch === b ? s.activeBranchTab : s.branchTab}>{b}</button>
            ))}
          </div>
          <button style={s.exportBtn} onClick={handleExportPlacedStudentsCSV}><Download size={16}/> Export Placed Students</button>
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

  const renderCompanies = () => {
    const pendingCount = companies.filter(c => c.status === 'pending').length;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{display:'flex', gap: '15px', marginBottom: '30px'}}>
           <div style={s.miniStat}><Building2 size={16} color="#6366f1"/> <b>{companies.length}</b> Total Partners</div>
           <div style={s.miniStat}><Clock size={16} color="#f59e0b"/> <b>{pendingCount}</b> Verification Pending</div>
        </div>

        <div style={s.tableContainer}>
          <div style={s.tableHeader}><h3 style={s.tableTitle}>Corporate Partner Directory</h3></div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Organization</th>
                <th style={s.th}>Verification</th>
                <th style={s.th}>Talent Interest</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length > 0 ? companies.map(c => (
                <tr key={c.company_id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.boldText}>{c.company_name}</div>
                    <div style={s.subText}>{c.email}</div>
                  </td>
                  <td style={s.td}>
                    <span style={{...s.statusBadge, 
                      backgroundColor: c.status === 'approved' ? '#dcfce7' : '#fef3c7', 
                      color: c.status === 'approved' ? '#166534' : '#92400e'}}>
                      {c.status === 'approved' ? <ShieldCheck size={12} style={{marginRight:'4px'}}/> : <Clock size={12} style={{marginRight:'4px'}}/>}
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button style={s.textBtn} onClick={() => fetchCompanyApplicants(c)}>
                      <Users size={14}/> View {companyApplicantSummary[c.company_id] || 0} Applicants
                    </button>
                  </td>
                  <td style={s.td}>
                    <div style={{display:'flex', gap:'12px'}}>
                      {c.status === 'pending' && (
                        <button onClick={() => handleApproveCompany(c.company_id, 'approved')} style={s.verifyBtn}>Verify Partner</button>
                      )}
                      <Trash2 onClick={() => handleDeleteCompany(c.company_id)} size={18} style={s.iconBtn} color="#ef4444" />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" style={{...s.td, textAlign: 'center', padding: '40px'}}><div style={s.subText}>No corporate partners registered yet.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {viewingCompanyApplicants && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{...s.bulkCard, marginTop: '30px', border: '2px solid #3b82f6'}}>
             {/* Applicant logic remains consistent but styled within renderCompanies */}
             <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                <h3 style={s.sectionTitle}>Engagement: {viewingCompanyApplicants.company_name}</h3>
                <button onClick={() => setViewingCompanyApplicants(null)} style={{background:'none', border:'none', cursor:'pointer'}}><Trash2 size={20} color="#94a3b8"/></button>
              </div>
              <div style={{maxHeight: '400px', overflowY:'auto'}}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Student</th>
                      <th style={s.th}>Applied For</th>
                      <th style={s.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyApplicants.length > 0 ? companyApplicants.map((app, idx) => (
                      <tr key={idx} style={s.tr}>
                        <td style={s.td}><div style={s.boldText}>{app.full_name}</div><div style={s.subText}>{app.department}</div></td>
                        <td style={s.td}>{app.job_role}</td>
                        <td style={s.td}><span style={{...s.statusBadge, backgroundColor: app.status === 'selected' ? '#dcfce7' : '#eff6ff', color: app.status === 'selected' ? '#166534' : '#1e40af'}}>{app.status.toUpperCase()}</span></td>
                      </tr>
                    )) : <tr><td colSpan="3" style={{...s.td, textAlign: 'center'}}>No applicants found.</td></tr>}
                  </tbody>
                </table>
              </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Req 1, 2, 3: Analytics View
  const renderAnalytics = () => {
    const totalIntake = placementStats.reduce((a, b) => a + (parseInt(b.total_students) || 0), 0);
    const totalPlaced = placementStats.reduce((a, b) => a + (parseInt(b.placed_count) || 0), 0);
    const totalUnplaced = placementStats.reduce((a, b) => a + (parseInt(b.unplaced_count) || 0), 0);
    const successRate = totalIntake > 0 ? ((totalPlaced / totalIntake) * 100).toFixed(1) : 0;

    // Aggregate totals by Branch for quick monitoring
    const branchStats = placementStats.reduce((acc, curr) => {
      const b = curr.branch;
      if (!acc[b]) acc[b] = { name: b, total: 0, placed: 0, divisions: new Set() };
      acc[b].total += parseInt(curr.total_students) || 0;
      acc[b].placed += parseInt(curr.placed_count) || 0;
      if (curr.division) acc[b].divisions.add(curr.division);
      return acc;
    }, {});

    const selectedBranchData = analyticBranch !== "All" ? branchStats[analyticBranch] : null;
    const divisionsList = selectedBranchData ? ["All", ...Array.from(selectedBranchData.divisions).sort()] : [];

    const filteredStats = placementStats.filter(stat => {
      const matchBranch = analyticBranch === "All" || stat.branch === analyticBranch;
      const matchDiv = analyticDivision === "All" || stat.division === analyticDivision;
      return matchBranch && matchDiv;
    });

    return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={s.analyticsHeader}>
        <div>
          <h2 style={s.sectionTitle}>Institutional Analytics</h2>
          <p style={s.subText}>Comprehensive monitoring of student intake and placement performance.</p>
        </div>
        <div style={{display:'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 'fit-content'}}>
          <StatCard label="Intake" value={totalIntake} icon={<Building2 size={16} color="#6366f1"/>} />
          <StatCard label="Lateral" value={placementStats.filter(s => s.intake_type?.toLowerCase().includes('lateral')).reduce((a, b) => a + (parseInt(b.total_students) || 0), 0)} icon={<ChevronRight size={18} color="#ec4899"/>} />
          <StatCard label="Placed" value={totalPlaced} icon={<CheckCircle size={16} color="#10b981"/>} />
          <StatCard label="Unplaced" value={totalUnplaced} icon={<Clock size={16} color="#f59e0b"/>} />
          <StatCard 
            label="Success Rate" 
            value={`${successRate}%`} 
            icon={<ShieldCheck size={16} color="#2563eb"/>} 
            customStyle={{ border: '1px solid #3b82f6', backgroundColor: '#eff6ff' }}
            valueStyle={{ color: '#2563eb' }}
          />
        </div>
      </div>

      {/* Branch-Wise Aggregated Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {Object.values(branchStats).map(b => (
          <div 
            key={b.name} 
            onClick={() => {
              setAnalyticBranch(prev => prev === b.name ? "All" : b.name);
              setAnalyticDivision("All");
            }}
            style={{ 
              ...s.card, 
              flexDirection: 'column', 
              alignItems: 'flex-start', 
              border: analyticBranch === b.name ? '2px solid #2563eb' : '1px solid #e2e8f0', 
              padding: '20px',
              cursor: 'pointer',
              backgroundColor: analyticBranch === b.name ? '#f0f9ff' : '#fff',
              transition: '0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
              <div>
                <span style={s.branchBadge}>{b.name}</span>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
                  {b.divisions.size > 0 ? `Divisions: ${Array.from(b.divisions).sort().join(', ')}` : 'No Divisions Recorded'}
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981' }}>{b.total > 0 ? ((b.placed / b.total) * 100).toFixed(0) : 0}% Placed</span>
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <p style={{ ...s.subText, fontSize: '11px', textTransform: 'uppercase' }}>Intake</p>
                <h3 style={{ margin: 0 }}>{b.total}</h3>
              </div>
              <div>
                <p style={{ ...s.subText, fontSize: '11px', textTransform: 'uppercase' }}>Selected</p>
                <h3 style={{ margin: 0 }}>{b.placed}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Division Tabs */}
      {analyticBranch !== "All" && divisionsList.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#e2e8f0', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
          {divisionsList.map(div => (
            <button 
              key={div} 
              onClick={() => setAnalyticDivision(div)} 
              style={analyticDivision === div ? s.activeBranchTab : s.branchTab}
            >
              {div === "All" ? `All Divisions` : `Div ${div}`}
            </button>
          ))}
        </div>
      )}

      <div style={s.tableContainer}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Batch</th>
              <th style={s.th}>Branch</th>
              <th style={s.th}>Div</th>
              <th style={s.th}>Intake</th>
              <th style={s.th}>Avg CGPA</th>
              <th style={s.th}>Total</th>
              <th style={s.th}>Placed</th>
              <th style={s.th}>Placement Rate</th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.length > 0 ? filteredStats.map((stat, i) => (
              <tr key={i} style={s.tr}>
                <td style={s.td}><span style={s.boldText}>{stat.batch}</span></td>
                <td style={s.td}><span style={s.branchBadge}>{stat.branch}</span></td>
                <td style={s.td}><b style={{color: '#475569'}}>{stat.division}</b></td>
                <td style={s.td}>{stat.intake_type}</td>
                <td style={s.td}><span style={s.cgpaText}>{stat.avg_cgpa || '0.00'}</span></td>
                <td style={s.td}>{stat.total_students}</td>
                <td style={s.td}>
                   <div style={s.boldText}>{stat.placed_count}</div>
                   <div style={s.subText}>{stat.unplaced_count} unplaced</div>
                </td>
                <td style={s.td}>
                  <div style={s.rateIndicator}>
                    {(() => {
                      const total = parseInt(stat.total_students) || 0;
                      const placed = parseInt(stat.placed_count) || 0;
                      const rate = total > 0 ? (placed / total * 100) : 0;
                      return (
                        <>
                    <div style={s.progressBarBg}>
                            <div style={{ ...s.progressBarFill, width: `${rate}%`, backgroundColor: rate > 70 ? '#10b981' : '#f59e0b' }}></div>
                    </div>
                          <span style={s.boldText}>{rate.toFixed(1)}%</span>
                        </>
                      );
                    })()}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="8" style={{...s.td, textAlign: 'center'}}>No analytics data found for the selected filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
    );
  };

  // Req 4: Bulk Upload View
  const renderBulkUpload = () => (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={s.bulkCard}>
      <div style={s.bulkHeader}>
        <UploadCloud size={32} color="#2563eb" />
        <div>
          <h2 style={s.sectionTitle}>Bulk Student Onboarding</h2>
          <p style={s.subText}>Standardize student registration by uploading a master Excel sheet.</p>
        </div>
      </div>

      <div style={s.uploadGrid}>
        <div style={s.uploadInfo}>
          <h4 style={s.smallTitle}>Data Requirements</h4>
          <ul style={s.instructionList}>
            <li>Accepted formats: <strong>.xlsx</strong> or <strong>.xls</strong></li>
            <li>Column Sequence: Email, Password, Name, ID, Branch, Batch, Intake, Division, CGPA</li>
            <li><strong>Intake Types:</strong> Regular, Lateral, or Transfer</li>
          </ul>
          <button onClick={() => {
            const headers = ["email", "password", "full_name", "college_id", "department", "batch_year", "intake_type", "division", "cgpa"];
            const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
            const link = document.createElement("a");
            link.href = encodeURI(csvContent);
            link.download = "placement_student_template.csv";
            link.click();
          }} style={s.outlineBtn}>
            <Download size={14} /> Download CSV Template
          </button>
          <button onClick={handleSeedDemoData} style={{...s.outlineBtn, marginTop: '12px', borderColor: '#8b5cf6', color: '#8b5cf6'}}>
            <Sparkles size={14} /> Quick Seed Demo Data
          </button>
        </div>

        <div style={s.uploadAction}>
          <div 
            style={{
              ...s.dropZone,
              borderColor: selectedBulkFile ? '#2563eb' : '#e2e8f0',
              backgroundColor: selectedBulkFile ? '#eff6ff' : '#f8fafc'
            }}
          >
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={(e) => setSelectedBulkFile(e.target.files[0])} 
              style={s.hiddenInput} 
              id="bulk-file-input"
            />
            <label htmlFor="bulk-file-input" style={s.dropLabel}>
              {selectedBulkFile ? (
                <span style={s.boldText}>{selectedBulkFile.name}</span>
              ) : (
                <>Click to <span style={{color: '#2563eb', textDecoration: 'underline'}}>browse</span> or drag file here</>
              )}
            </label>
          </div>
          
          <button onClick={handleBulkUpload} style={s.primaryBtn} disabled={!selectedBulkFile || loading}>
             {loading ? "Processing Records..." : "Process Bulk Upload"}
          </button>
        </div>
      </div>

      {/* Data Preview Table after successful upload */}
      {uploadedDataPreview.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{marginTop: '40px'}}>
          <div style={s.tableHeader}>
            <h3 style={s.tableTitle}>Upload Summary: {uploadedDataPreview.length} New Records</h3>
            <button onClick={() => setUploadedDataPreview([])} style={s.outlineBtn}>Clear Preview</button>
          </div>
          <div style={{maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '16px'}}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>ID</th>
                  <th style={s.th}>Branch</th>
                  <th style={s.th}>Type</th>
                  <th style={s.th}>CGPA</th>
                </tr>
              </thead>
              <tbody>
                {uploadedDataPreview.map((item, idx) => (
                  <tr key={idx} style={s.tr}>
                    <td style={s.td}><div style={s.boldText}>{item.full_name}</div><div style={s.subText}>{item.email}</div></td>
                    <td style={s.td}><code>{item.college_id}</code></td>
                    <td style={s.td}>{item.department}</td>
                    <td style={s.td}><span style={s.branchBadge}>{item.intake_type}</span></td>
                    <td style={s.td}><span style={s.cgpaText}>{item.cgpa}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

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
          <NavItem active={activeTab === 'overview'} icon={<LayoutDashboard size={20}/>} label="Overview" onClick={() => setActiveTab('overview')} />
          <NavItem active={activeTab === 'students'} icon={<Users size={20}/>} label="Student Records" onClick={() => setActiveTab('students')} />
          <NavItem active={activeTab === 'companies'} icon={<Building2 size={20}/>} label="Corporate Partners" onClick={() => setActiveTab('companies')} />
          <NavItem active={activeTab === 'analytics'} icon={<BarChart3 size={20}/>} label="Analytics" onClick={() => setActiveTab('analytics')} />
          <NavItem active={activeTab === 'bulk-upload'} icon={<UploadCloud size={20}/>} label="Bulk Upload" onClick={() => setActiveTab('bulk-upload')} />
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
            {activeTab === 'companies' && renderCompanies()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'bulk-upload' && renderBulkUpload()}
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

const StatCard = ({ label, value, icon, customStyle = {}, valueStyle = {} }) => (
  <div style={{ ...s.card, ...customStyle }}>
    <div style={s.cardIconArea}>{icon}</div>
    <div>
      <p style={s.cardLabel}>{label}</p>
      <h2 style={{ ...s.cardValue, ...valueStyle }}>{value || '0'}</h2>
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

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' },
  card: { backgroundColor: '#fff', padding: '16px 20px', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  cardIconArea: { width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardLabel: { fontSize: '13px', color: '#64748b', fontWeight: '700', margin: 0 },
  cardValue: { fontSize: '22px', fontWeight: '900', margin: '2px 0 0 0' },

  tableContainer: { backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' },
  tableHeader: { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableTitle: { fontSize: '18px', fontWeight: '800', margin: 0 },
  livePulse: { fontSize: '12px', fontWeight: '800', color: '#10b981', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 24px', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' },
  tr: { transition: '0.2s', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '20px 24px', fontSize: '14px' },
  boldText: { fontWeight: '700', color: '#1e293b' },
  statusBadge: { padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center' },

  controlsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  tabGroup: { display: 'flex', gap: '8px', backgroundColor: '#e2e8f0', padding: '6px', borderRadius: '16px' },
  branchTab: { padding: '8px 20px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: '700', cursor: 'pointer' },
  activeBranchTab: { padding: '8px 20px', borderRadius: '12px', border: 'none', background: '#fff', color: '#2563eb', fontWeight: '800', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  exportBtn: { backgroundColor: '#1e293b', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  
  studentInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' },
  idBadge: { backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' },
  branchBadge: { backgroundColor: '#f0f9ff', color: '#0369a1', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' },
  cgpaText: { color: '#2563eb', fontWeight: '800', backgroundColor: '#eff6ff', padding: '4px 8px', borderRadius: '6px' },
  iconBtn: { cursor: 'pointer', transition: '0.2s' },
  verifyBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' },
  textBtn: { border: 'none', background: 'none', color: '#475569', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' },
  miniStat: { backgroundColor: '#fff', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0', color: '#475569' },
  approveBtn: { backgroundColor: '#dcfce7', color: '#166534', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer', transition: '0.2s' },
  loadingArea: { textAlign: 'center', padding: '100px 0', color: '#64748b', fontWeight: '700' },
  notification: { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', color: '#fff', borderRadius: '16px', zIndex: 1000, fontWeight: '700', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  sectionTitle: { fontSize: '24px', fontWeight: '800', margin: '0 0 20px 0', color: '#1e293b' },
  fileInput: { padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', width: '100%', backgroundColor: '#f8fafc' },
  selectedFileText: { marginTop: '10px', fontSize: '14px', color: '#475569' },
  primaryBtn: { backgroundColor: '#2563eb', color: '#fff', padding: '14px 24px', borderRadius: '14px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  label: { fontSize: '14px', fontWeight: '700', color: '#475569' },
  
  bulkCard: { backgroundColor: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  bulkHeader: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' },
  smallTitle: { fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '16px' },
  instructionList: { padding: '0 0 0 18px', margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.8' },
  outlineBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#1e293b', fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
  dropZone: { border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '40px', textAlign: 'center', cursor: 'pointer', transition: '0.2s' },
  hiddenInput: { display: 'none' },
  dropLabel: { cursor: 'pointer', fontSize: '14px', color: '#64748b' },
  uploadAction: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' },
  
  uploadGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  uploadInfo: { display: 'flex', flexDirection: 'column' },
  smallTitle: { fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '16px' },
  instructionList: { padding: '0 0 0 18px', margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.8' },
  outlineBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#1e293b', fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
  dropZone: { border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '40px', textAlign: 'center', cursor: 'pointer', transition: '0.2s' },
  hiddenInput: { display: 'none' },
  dropLabel: { cursor: 'pointer', fontSize: '14px', color: '#64748b' },
  uploadAction: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' },
  
  // analyticsProgressItem: { display: 'flex', flexDirection: 'column', gap: '8px' },
  // progressBarBg: { width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' },
  // progressBarFill: { height: '100%', borderRadius: '10px' },
  // intakeGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginTop: '10px' },
  // intakeBox: { padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' },
  // intakeLabel: { fontSize: '13px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' },
  // intakeValue: { fontSize: '24px', fontWeight: '900', color: '#1e293b' },
  analyticsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' },
  rateIndicator: { display: 'flex', alignItems: 'center', gap: '12px', width: '180px' }
};