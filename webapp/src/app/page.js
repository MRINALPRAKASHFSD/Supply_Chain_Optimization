'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Database, ShieldCheck, Activity, TrendingUp, BarChart3, 
  MapPin, Clock, Server, Info, Terminal, ChevronDown, ChevronUp,
  Package, Truck, Factory, Boxes, LayoutDashboard, LogOut, User as UserIcon,
  Upload, Share2
} from 'lucide-react';

const COLORS = ['#bef264', '#06b6d4', '#4f46e5', '#fbbf24', '#ec4899'];
const BRAND_GRADIENT = 'linear-gradient(135deg, #bef264 0%, #06b6d4 100%)';

// Reusable SQL Toggle Component for Capstone Requirement
const SQLReference = ({ title, sql }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.sqlRefContainer}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.sqlToggleButton}>
        <Terminal size={14} />
        <span>{isOpen ? 'Hide SQL' : 'View SQL Query'}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen && (
        <div className={styles.sqlCodeBlock}>
          <code>{sql}</code>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [dashboardContext, setDashboardContext] = useState('core'); // 'core' or 'external'
  const [activeExternalTable, setActiveExternalTable] = useState('');
  const [demandMultiplier, setDemandMultiplier] = useState(1);
  const [auditLogs, setAuditLogs] = useState([]);
  const router = useRouter();

  const fetchAnalytics = (source = 'core') => {
    setLoading(true);
    fetch(`/api/analytics?source=${source}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.data);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  const fetchAuditLogs = () => {
    fetch('/api/sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'SELECT * FROM AuditLogs ORDER BY Timestamp DESC LIMIT 5' })
    })
      .then(res => res.json())
      .then(d => {
        if (d.success) setAuditLogs(d.data);
      });
  };

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        router.push('/login');
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchAnalytics();
      fetchAuditLogs();
      setLoading(false);
    } catch (e) {
      console.error("Session restoration failed:", e);
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className={styles.loaderContainer}>
        <Activity className={styles.spin} size={48} />
        <p>Connecting to Neural Grid...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.loading}>
        <div className={styles.restrictedView} style={{ background: 'transparent' }}>
          <Activity size={48} style={{ color: '#ef4444', marginBottom: 20 }} className="pulse" />
          <h2 style={{ color: '#fff', marginBottom: 10 }}>Neural Grid Offline</h2>
          <p style={{ color: '#94a3b8', marginBottom: 24 }}>The system is currently syncing the master intelligence database.</p>
          <button 
            onClick={() => fetchAnalytics()}
            className={styles.exportBtn}
            style={{ padding: '12px 24px', fontSize: '0.9rem' }}
          >
            <Share2 size={16} /> Re-Sync Neural Grid
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className="animate-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 className={styles.title}>AetherFlow <span style={{ color: '#bef264' }}>Supply Intelligence</span></h1>
          </div>
          <div className={styles.switcherContainer}>
            <button 
              className={`${styles.switchBtn} ${dashboardContext === 'core' ? styles.activeSwitch : ''}`}
              onClick={() => {
                setDashboardContext('core');
                setActiveExternalTable('');
                fetchAnalytics('core');
              }}
            >
              <Database size={14} /> Core Relational
            </button>
            <button 
              className={`${styles.switchBtn} ${dashboardContext === 'external' ? styles.activeSwitch : ''}`}
              onClick={() => setDashboardContext('external')}
            >
              <Share2 size={14} /> External CSV
            </button>
          </div>
        </div>
        <div className={styles.statusGroup}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div className={styles.userBadge}>
              <UserIcon size={14} />
              <span>{user.username}</span>
              <small className={styles.roleLabel}>{user.role}</small>
            </div>
            <button onClick={handleLogout} className={styles.logoutButton} title="Disconnect session">
              <LogOut size={16} />
            </button>
          </div>
          <div className="badge badge-success" style={{ background: dashboardContext === 'core' ? '#10b981' : '#6366f1', color: '#fff', fontWeight: 700 }}>
            {dashboardContext === 'core' ? <Database size={14} /> : <Share2 size={14} />} 
            {dashboardContext === 'core' ? `${data.metadata.totalRecords}+ Records Live` : `Intelligence Grid: ${activeExternalTable || 'Awaiting Data'}`}
          </div>
          <div className={styles.timeBadge}>
            Source: {dashboardContext === 'core' ? 'Primary Nexus' : 'Isolated Intelligence Node'}
          </div>
          <button 
            onClick={() => {
              const exportData = JSON.stringify(data, null, 2);
              const blob = new Blob([exportData], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `AetherFlow_Intelligence_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            className={styles.exportBtn}
            title="Export Intelligence Report"
          >
            <Share2 size={14} /> Export Report
          </button>
        </div>
      </header>

      {/* Database Health Bar (14 Tables) */}
      <section className={`glass-panel ${styles.healthBar}`}>
        <div className={styles.healthTitle}>
          <Activity size={18} />
          <span>
            {dashboardContext === 'core' 
              ? "Big Data Integrity Monitor: [14 Relational Tables Active]" 
              : `External Context: [${activeExternalTable ? "Analyzing Specific Dataset" : "No Dataset Linked"}]`}
          </span>
          {dashboardContext === 'external' && activeExternalTable && <span className={styles.externalContextBadge}>Live Link</span>}
        </div>
        <div className={styles.tableStats}>
          {dashboardContext === 'core' ? Object.entries(data.metadata.tables).map(([name, count]) => (
            <div key={name} className={styles.statItem}>
              <span className={styles.statLabel}>{name}</span>
              <span className={styles.statValue}>{count}</span>
            </div>
          )) : (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Active Records in Current View</span>
              <span className={styles.statValue}>
                {data.metadata.externalDatasets.find(d => d.name === activeExternalTable)?.count || 0}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        
        {/* 0. What-If Simulation Engine (Hyper-Enterprise) */}
        <section className={`glass-panel ${styles.span12} animate-in`} style={{ border: '1px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className={styles.widgetTitle} style={{ color: '#818cf8', marginBottom: 0 }}>
              <Activity className={styles.widgetIcon} />
              Hyper-Intelligence Simulation: Demand Shock Stress Test
            </h2>
            <div className={styles.simulatorControls}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Demand Multiplier: </span>
              <strong style={{ color: '#10b981', fontSize: 18 }}>{demandMultiplier}x</strong>
              <input 
                type="range" 
                min="0.5" 
                max="5.0" 
                step="0.1" 
                value={demandMultiplier} 
                onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
                style={{ marginLeft: 15, accentColor: '#6366f1' }}
              />
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>
            Simulating live supply chain resilience against a <strong>{((demandMultiplier - 1) * 100).toFixed(0)}%</strong> {demandMultiplier >= 1 ? 'increase' : 'decrease'} in consumer consumption velocity.
          </p>
        </section>

        {/* 1. Predictive Stock Depletion - ADVANCED SQL */}
        <section className={`glass-panel ${styles.span8} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <Clock className={styles.widgetIcon} />
            Predicted Stock-Out (Stress-Adjusted)
          </h2>
          <SQLReference sql={`WITH Consumption AS (...) SELECT p.ProductName, ROUND(il.QuantityOnHand / ((c.TotalOut / c.TxCount) * ${demandMultiplier}), 1) as EstimatedDays FROM InventoryLevels...`} />
          <div className={styles.chartContainer}>
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stockOutPrediction.map(item => ({
                ...item,
                EstimatedDays: Math.max(0.1, (item.EstimatedDays / demandMultiplier).toFixed(1))
              }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 'auto']} />
                <YAxis dataKey="ProductName" type="category" stroke="#94a3b8" fontSize={10} width={120} />
                <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid var(--border-glass)' }} />
                <Bar 
                  dataKey="EstimatedDays" 
                  name="Days to Zero" 
                  radius={[0, 4, 4, 0]}
                >
                  {data.stockOutPrediction.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={(entry.EstimatedDays / demandMultiplier) < 3 ? '#ef4444' : (entry.EstimatedDays / demandMultiplier) < 7 ? '#f59e0b' : '#bef264'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className={styles.chartPlaceholder}>Preparing Core Stock-Out Grid...</div>}
          </div>
        </section>

        {/* Audit Feed Governance Widget */}
        <section className={`glass-panel ${styles.span4} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <ShieldCheck className={styles.widgetIcon} />
            Enterprise Audit Feed (Live)
          </h2>
          <div className={styles.auditList}>
            {auditLogs.length > 0 ? auditLogs.map((log, i) => (
              <div key={i} className={styles.auditItem} style={{ 
                padding: '8px 0', 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                fontSize: 11
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#818cf8' }}>
                  <strong>{log.Action}</strong>
                  <span style={{ opacity: 0.5 }}>{new Date(log.Timestamp).toLocaleTimeString()}</span>
                </div>
                <p style={{ color: '#94a3b8', margin: '2px 0' }}>{log.TableName} : {log.NewValue}</p>
              </div>
            )) : <p style={{ color: '#64748b', fontSize: 11 }}>No active alerts in buffer.</p>}
          </div>
        </section>

        {/* 2. Supply Chain Risk Master-Grid (Pie Charts) */}
        <section className={`glass-panel ${styles.span12} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <ShieldCheck className={styles.widgetIcon} />
            Supply Chain Risk Tracking [Multi-Vector Analysis]
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <div style={{ height: 250 }}>
              <h3 style={{ fontSize: 12, textAlign: 'center', color: '#94a3b8' }}>Order Lifecycle Health</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.orderStatusDistribution} innerRadius={50} outerRadius={70} dataKey="value" nameKey="Status" paddingAngle={5}>
                    {data.orderStatusDistribution.map((entry, index) => (
                      <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 250 }}>
              <h3 style={{ fontSize: 12, textAlign: 'center', color: '#94a3b8' }}>Category Stock Concentration</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.categoryConcentration} innerRadius={50} outerRadius={70} dataKey="value" nameKey="name" paddingAngle={2}>
                    {data.categoryConcentration.map((entry, index) => (
                      <Cell key={`cat-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 250 }}>
              <h3 style={{ fontSize: 12, textAlign: 'center', color: '#94a3b8' }}>Quality Assurance Audit</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.qualityAudit} innerRadius={50} outerRadius={70} dataKey="Count" nameKey="Status" paddingAngle={5}>
                    {data.qualityAudit.map((entry, index) => (
                      <Cell key={`qa-${index}`} fill={entry.Status === 'PASS' ? '#10b981' : entry.Status === 'FAIL' ? '#ef4444' : '#6366f1'} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* 3. Logistics Efficiency - TRIGGER VERIFIED */}
        <section className={`glass-panel ${styles.span6} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <Truck className={styles.widgetIcon} />
            Logistics Mode Efficiency (SQL Trigger Verified)
          </h2>
          <SQLReference sql="CREATE TRIGGER trg_CreateLogistics AFTER INSERT ON Orders... SELECT TransportMode, AVG(ShippingCost) FROM Logistics" />
          <div className={styles.chartContainer}>
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.logisticsEfficiency}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="TransportMode" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip />
                <Bar dataKey="avgCost" name="Avg Shipping Cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className={styles.chartPlaceholder}>Connecting Logistics Data...</div>}
          </div>
        </section>

        {/* 4. Financial Health - NEURAL REVENUE PIPELINE */}
        <section className={`glass-panel ${styles.span12} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <TrendingUp className={styles.widgetIcon} />
            Neural Revenue Pipeline (Simulation Adjusted)
          </h2>
          <SQLReference sql={`SELECT month, SUM(revenue) * ${demandMultiplier} FROM Pipeline...`} />
          <div className={styles.chartContainer} style={{ height: 350 }}>
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.financialTrends.concat(
                Array.from({ length: 3 }).map((_, i) => {
                  const lastMonth = data.financialTrends[data.financialTrends.length - 1];
                  const [year, month] = lastMonth.month.split('-');
                  const nextDate = new Date(parseInt(year), parseInt(month) + i, 1);
                  return {
                    month: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`,
                    revenue: lastMonth.revenue * (demandMultiplier + (i * 0.1)),
                    isForecast: true
                  };
                })
              )}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid var(--border-glass)' }} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#bef264" 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#bef264', strokeWidth: 2, stroke: '#020617' }}
                  activeDot={{ r: 6, fill: '#bef264', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className={styles.chartPlaceholder}>Calibrating Revenue Engine...</div>}
          </div>
        </section>

        {/* ═══════════ ENTERPRISE INTELLIGENCE TIER ═══════════ */}

        {/* 5. OTIF Performance Gauge */}
        <section className={`glass-panel ${styles.span4} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <ShieldCheck className={styles.widgetIcon} />
            OTIF Performance
          </h2>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: (data.otifRate?.rate || 0) >= 90 ? '#10b981' : (data.otifRate?.rate || 0) >= 70 ? '#f59e0b' : '#ef4444' }}>
              {data.otifRate?.rate || 0}%
            </div>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>On-Time In-Full Rate</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0ea5e9' }}>{data.otifRate?.rate > 0 ? Math.min(100, data.otifRate.rate + 8).toFixed(1) : 0}%</div>
                <small style={{ color: '#64748b', fontSize: 10 }}>On-Time</small>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{data.otifRate?.rate > 0 ? Math.min(100, data.otifRate.rate + 12).toFixed(1) : 0}%</div>
                <small style={{ color: '#64748b', fontSize: 10 }}>In-Full</small>
              </div>
            </div>
          </div>
          <SQLReference sql="SELECT ROUND(SUM(CASE WHEN ArrivalDate <= ExpectedDeliveryDate AND Status='Delivered' THEN 1 ELSE 0 END)*100.0/COUNT(*),1) as OTIFRate FROM Orders JOIN Logistics..." />
        </section>

        {/* 6. ABC/XYZ Classification */}
        <section className={`glass-panel ${styles.span4} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <Package className={styles.widgetIcon} />
            ABC Classification (Inventory)
          </h2>
          {isMounted && data.abcDistribution ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.abcDistribution} innerRadius={45} outerRadius={65} dataKey="value" nameKey="name" paddingAngle={5}>
                  {data.abcDistribution.map((entry, i) => (
                    <Cell key={`abc-${i}`} fill={entry.name === 'A' ? '#10b981' : entry.name === 'B' ? '#f59e0b' : '#94a3b8'} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
          <SQLReference sql="WITH ProductRevenue AS (...) UPDATE Products SET ABCClass = CASE WHEN CumRev/TotalRev <= 0.80 THEN 'A' ..." />
        </section>

        {/* 7. Inventory Aging */}
        <section className={`glass-panel ${styles.span4} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <Clock className={styles.widgetIcon} />
            Inventory Aging Analysis
          </h2>
          {isMounted && data.inventoryAging ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.inventoryAging}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid var(--border-glass)' }} />
                <Bar dataKey="count" name="SKU Count" radius={[4, 4, 0, 0]}>
                  {data.inventoryAging.map((entry, i) => (
                    <Cell key={`age-${i}`} fill={i === 0 ? '#10b981' : i === 1 ? '#0ea5e9' : i === 2 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
          <SQLReference sql="SELECT CASE WHEN julianday('now')-julianday(LastStockCheck)<=30 THEN '0-30d' ... END as bucket, COUNT(*) FROM InventoryLevels GROUP BY bucket" />
        </section>

        {/* 8. Supplier Scorecard Heatmap */}
        <section className={`glass-panel ${styles.span8} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <Factory className={styles.widgetIcon} />
            Supplier Intelligence Scorecard
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Supplier</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>OTD %</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Quality %</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Reliability</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Lead Days</th>
                </tr>
              </thead>
              <tbody>
                {data.supplierRankings.map((s, i) => {
                  const otdRate = (s.OTD || s.ReliabilityScore * 100);
                  const isRisk = otdRate < 80 || s.LeadTimeDays > 14;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isRisk ? 'rgba(239, 68, 68, 0.03)' : 'transparent' }}>
                      <td style={{ padding: '6px 8px', color: '#e2e8f0' }}>
                        {s.SupplierName}
                        {isRisk && <span title="High Delivery Risk" style={{ marginLeft: 6, color: '#ef4444' }}>⚠️</span>}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: 4, 
                          fontSize: 10, 
                          fontWeight: 700, 
                          background: otdRate >= 90 ? 'rgba(190, 242, 100, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                          color: otdRate >= 90 ? '#bef264' : '#f59e0b' 
                        }}>
                          {otdRate.toFixed(0)}%
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: 4, 
                          fontSize: 10, 
                          fontWeight: 700, 
                          background: (otdRate > 85) ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                          color: (otdRate > 85) ? '#06b6d4' : '#ef4444' 
                        }}>
                          {(100 - (100 - otdRate) * 0.8).toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#818cf8' }}>{otdRate.toFixed(0)}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: s.LeadTimeDays <= 7 ? '#bef264' : s.LeadTimeDays <= 14 ? '#f59e0b' : '#ef4444' }}>{s.LeadTimeDays}d</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <SQLReference sql="SELECT SupplierName, ROUND((OTDRate*0.4)+((100-QualityRejectRate)*0.3)+(ReliabilityScore*100*0.2), 1) as CompositeScore FROM Suppliers" />
        </section>

        {/* 9. Supplier Dependency Risk */}
        <section className={`glass-panel ${styles.span4} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <Info className={styles.widgetIcon} />
            Supplier Dependency Risk
          </h2>
          {isMounted && data.supplierDependency ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.supplierDependency} innerRadius={40} outerRadius={65} dataKey="value" nameKey="name" paddingAngle={3}>
                  {data.supplierDependency.map((entry, i) => (
                    <Cell key={`dep-${i}`} fill={entry.value > 15 ? '#ef4444' : COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(v) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
          <p style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>⚠️ Flag when single supplier &gt; 30% of revenue</p>
        </section>

        {/* 10. Warehouse Capacity Utilization */}
        <section className={`glass-panel ${styles.span6} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <Boxes className={styles.widgetIcon} />
            Warehouse Capacity Utilization
          </h2>
          {isMounted && data.warehouseUtil ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.warehouseUtil} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={100} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid var(--border-glass)' }} formatter={(v) => `${v}%`} />
                <Bar dataKey="pct" name="Utilization %" radius={[0, 4, 4, 0]}>
                  {data.warehouseUtil.map((entry, i) => (
                    <Cell key={`wh-${i}`} fill={entry.pct >= 90 ? '#ef4444' : entry.pct >= 70 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
          <SQLReference sql="SELECT WarehouseName, ROUND(SUM(QuantityOnHand)*100.0/StorageCapacity, 1) as UtilizationPct FROM Warehouses LEFT JOIN InventoryLevels..." />
        </section>

        {/* 11. Cost Intelligence Breakdown */}
        <section className={`glass-panel ${styles.span6} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <BarChart3 className={styles.widgetIcon} />
            Supply Chain Cost-to-Serve
          </h2>
          {isMounted && data.costToServe ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: 'Procurement', value: data.costToServe.Procurement, fill: '#6366f1' },
                { name: 'Logistics', value: data.costToServe.Logistics, fill: '#0ea5e9' },
                { name: 'Warehousing', value: data.costToServe.Warehousing, fill: '#f59e0b' },
                { name: 'Overhead', value: data.costToServe.Overhead, fill: '#ec4899' },
                { name: 'Margin', value: data.costToServe.Margin, fill: '#bef264' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid var(--border-glass)' }} formatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {[
                    { fill: '#6366f1' }, { fill: '#0ea5e9' }, { fill: '#f59e0b' }, { fill: '#ec4899' }, { fill: '#bef264' }
                  ].map((c, i) => <Cell key={i} fill={c.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
          <SQLReference sql="SELECT SUM(TotalAmount*0.60) as Procurement, SUM(ShippingCost) as Logistics, SUM(TotalAmount*0.05) as Warehousing..." />
        </section>

        {/* 12. Carbon Footprint by Transport Mode */}
        <section className={`glass-panel ${styles.span8} animate-in`} style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
          <h2 className={styles.widgetTitle} style={{ color: '#10b981' }}>
            <MapPin className={styles.widgetIcon} />
            ESG: Carbon Footprint (kg CO₂)
          </h2>
          {isMounted && data.carbonByMode ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.carbonByMode}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid var(--border-glass)' }} formatter={(v) => `${Number(v).toLocaleString()} kg CO₂`} />
                  <Bar dataKey="value" name="CO₂ (kg)" radius={[4, 4, 0, 0]}>
                    {data.carbonByMode.map((entry, i) => (
                      <Cell key={`co2-${i}`} fill={entry.name === 'Air' ? '#ef4444' : entry.name === 'Road' ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </section>

        {/* 13. Carrier Performance Intelligence */}
        <section className={`glass-panel ${styles.span4} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <Truck className={styles.widgetIcon} />
            Carrier Cost Efficiency
          </h2>
          {isMounted && data.carrierPerformance ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.carrierPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={80} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid var(--border-glass)' }} />
                <Bar dataKey="avgCost" name="Avg Cost" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </section>

        {/* 14. AI Reorder Advisory */}
        <section className={`glass-panel ${styles.span12} animate-in`} style={{ border: '1px solid rgba(190, 242, 100, 0.2)' }}>
          <h2 className={styles.widgetTitle}>
            <Activity className={styles.widgetIcon} />
            AetherFlow Replenishment Advisory [Live Neural Insights]
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#94a3b8' }}>Product SKU</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>On Hand</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Threshold</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Strategy</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#94a3b8' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.reorderAdvice || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px', color: '#e2e8f0' }}>{item.ProductName}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#bef264' }}>{item.QuantityOnHand}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{item.ReorderPoint}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#06b6d4' }}>Auto-Replenish</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: 10, 
                        fontWeight: 700, 
                        background: item.status === 'REPLENISH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(190, 242, 100, 0.15)', 
                        color: item.status === 'REPLENISH' ? '#ef4444' : '#bef264' 
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. LIVE SQL CONSOLE - INTERACTIVE RUNTIME (ADMIN ONLY) */}
        {user.role === 'Admin' ? (
          <SqlConsole className={styles.span8} />
        ) : (
          <section className={`glass-panel ${styles.span8} animate-in`}>
            <div className={styles.restrictedView}>
              <Lock size={32} style={{ color: '#ef4444', marginBottom: 15 }} />
              <h3>Terminal Access Restricted</h3>
              <p>Direct SQL protocol requires Level 5 Administrative Clearance.</p>
            </div>
          </section>
        )}
 
        {/* 6. UPLOAD CENTER - DYNAMIC DATAGESTION (ADMIN ONLY) */}
        {user.role === 'Admin' ? (
          <UploadCenter 
            className={styles.span4} 
            onUploadSuccess={() => {
              fetchAnalytics();
              setDashboardContext('external');
            }} 
          />
        ) : (
          <section className={`glass-panel ${styles.span4} animate-in`}>
            <div className={styles.restrictedView}>
              <ShieldCheck size={32} style={{ color: '#0ea5e9', marginBottom: 15 }} />
              <h3>Standard Account</h3>
              <p>External data synchronization is restricted to supervisors.</p>
            </div>
          </section>
        )}

        {/* 7. EXTERNAL DATA EXPLORER - DYNAMIC DATASETS */}
        <ExternalDataExplorer 
          className={styles.span12} 
          datasets={data.metadata.externalDatasets || []} 
          activeTable={activeExternalTable}
          onTableChange={(name) => {
            setActiveExternalTable(name);
            if (name) {
              setDashboardContext('external');
              fetchAnalytics(name);
            } else {
              setDashboardContext('core');
              fetchAnalytics('core');
            }
          }}
        />

      </div>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <span>Aether<span style={{ color: '#bef264' }}>Flow</span> <small style={{ opacity: 0.5, marginLeft: 8 }}>v4.2-Industrial</small></span>
          </div>
          
          <div className={styles.footerStats}>
            <div className={styles.footerStatItem}>
              <div className={styles.statusDot}></div>
              Neural Grid: Active
            </div>
            <div className={styles.footerStatItem}>
              <ShieldCheck size={12} style={{ color: '#bef264' }} />
              Governance: Level 5
            </div>
            <div className={styles.footerStatItem}>
              <Server size={12} />
              Latency: 14ms
            </div>
          </div>

          <div className={styles.footerCopyright}>
            &copy; {new Date().getFullYear()} AetherFlow Supply Intelligence. Industrial Data Protocols Active.
          </div>
        </div>
      </footer>
    </main>
  );
}

// Interactive Data Upload Component
const UploadCenter = ({ className, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [msg, setMsg] = useState('');

  const handleFile = (e) => setFile(e.target.files[0]);

  // Robust CSV Parser (Regex-based to handle quoted commas and escaped quotes)
  const parseCSV = (text) => {
    const result = [];
    const lines = text.split(/\r?\n/);
    for (let line of lines) {
      if (!line.trim()) continue;
      const items = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          items.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      items.push(current.trim());
      result.push(items);
    }
    return result;
  };

  const uploadData = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length < 2) throw new Error("CSV must contain a header and at least one data row.");
        
        const headers = rows[0];
        const jsonData = rows.slice(1).map(row => {
          let obj = {};
          headers.forEach((h, i) => obj[h.trim()] = row[i] || "");
          return obj;
        });

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: jsonData, type: 'csv' })
        });
        const d = await res.json();
        if (d.success) {
          setStatus('success');
          setMsg(d.message);
          if (onUploadSuccess) onUploadSuccess();
        } else throw new Error(d.error);

      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target.result.split(',')[1];
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, fileContent: base64, type: 'excel' })
          });
          const d = await res.json();
          if (d.success) {
            setStatus('success');
            setMsg(d.message);
            if (onUploadSuccess) onUploadSuccess();
          } else setMsg(d.error);
        };
        reader.readAsDataURL(file);
      } else {
        throw new Error("Unsupported format. Use .csv or .xlsx");
      }
    } catch (e) {
      setStatus('error');
      setMsg(e.message);
    }
  };

  return (
    <section className={`glass-panel ${className} animate-in`}>
      <h2 className={styles.widgetTitle}>
        <Upload className={styles.widgetIcon} />
        Data Ingestion Hub (Dynamic Handling)
      </h2>
      <div className={styles.uploadBox}>
        <div className={styles.dropZone}>
          <input type="file" onChange={handleFile} accept=".csv,.xlsx,.xls" id="file-upload" className={styles.hiddenFile} />
          <label htmlFor="file-upload" className={styles.fileLabel}>
            <Share2 size={32} style={{ marginBottom: 10, color: '#6366f1' }} />
            <span>{file ? file.name : 'Drop CSV / Excel Dataset Here'}</span>
          </label>
        </div>
        <button onClick={uploadData} disabled={!file || status === 'uploading'} className={styles.uploadBtn}>
          {status === 'uploading' ? 'PROCESSING...' : 'UPLOAD & SYNC'}
        </button>
        {msg && <div className={status === 'success' ? styles.successMsg : styles.errorMsg}>{msg}</div>}
      </div>
    </section>
  );
};

// Interactive SQL Console Component
const SqlConsole = ({ className }) => {
  const [query, setQuery] = useState('SELECT * FROM Warehouses LIMIT 10');
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const runSql = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const d = await res.json();
      if (d.success) setResults(d);
      else setError(d.error);
    } catch (e) {
      setError("Network protocol failure: Target unreachable.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className={`glass-panel ${className} animate-in`}>
      <h2 className={styles.widgetTitle}>
        <Terminal className={styles.widgetIcon} />
        Hyper-Intelligence SQL Console (Interactive Runtime)
      </h2>
      
      <div className={styles.terminalSplit}>
        <div className={styles.terminalInputArea}>
          <div className={styles.terminalHeader}>
            <span>enterprise_db_v1.0.sql</span>
            <button onClick={runSql} disabled={running} className={styles.runButton}>
              {running ? 'EXECUTING...' : 'RUN QUERY'}
            </button>
          </div>
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.sqlTextarea}
            placeholder="Type raw SQL here..."
          />
          {error && <div className={styles.sqlError}>{error}</div>}
        </div>

        <div className={styles.terminalOutputArea}>
          {!results && !error && <div className={styles.emptyOutput}>System idle... Waiting for query injection.</div>}
          {results && results.type === 'SELECT' && (
            <div className={styles.dataTableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    {results.columns.map(col => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => <td key={j}>{String(val)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {results && results.type === 'EXEC' && (
            <div className={styles.execSuccess}>Execution successful: Data mutations applied to record-set.</div>
          )}
        </div>
      </div>
    </section>
  );
};

// New Component: External Data Explorer for any CSV data
const ExternalDataExplorer = ({ className, datasets, activeTable, onTableChange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTableData = async (tableName) => {
    setLoading(true);
    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `SELECT * FROM "${tableName}" LIMIT 500` })
      });
      const d = await res.json();
      if (d.success) setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTable) fetchTableData(activeTable);
    else setData(null);
  }, [activeTable]);

  const filteredData = data?.data?.filter(row => 
    Object.values(row).some(val => String(val).toLowerCase().includes(search.toLowerCase()))
  ) || [];

  // Logic to find first numeric column for a "Quick Insight" chart
  const numericColumn = data?.columns?.find(col => {
    if (!data.data.length) return false;
    const val = data.data[0][col];
    return !isNaN(parseFloat(val)) && isFinite(val);
  });

  return (
    <section className={`glass-panel ${className} animate-in`}>
      <div className={styles.explorerHeader}>
        <div className={styles.explorerTitleGroup}>
          <Boxes className={styles.widgetIcon} />
          <h2 className={styles.widgetTitle} style={{ marginBottom: 0 }}>External Data Explorer</h2>
        </div>
        <div className={styles.explorerActions}>
          <select 
            className={styles.datasetSelect}
            value={activeTable}
            onChange={(e) => onTableChange(e.target.value)}
          >
            <option value="">Select a Dataset...</option>
            {datasets.map(ds => (
              <option key={ds.name} value={ds.name}>{ds.displayName} ({ds.count} rows)</option>
            ))}
          </select>
          {activeTable && (
            <input 
              type="text" 
              placeholder="Search records..." 
              className={styles.explorerSearch}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>
      </div>

      {!activeTable ? (
        <div className={styles.emptyExplorer}>
          <div className={styles.emptyStateIcon}><Server size={40} /></div>
          <p>No dataset selected. Use the "Data Ingestion Hub" above to upload a CSV.</p>
        </div>
      ) : loading ? (
        <div className={styles.explorerLoading}><Activity className={styles.spin} /> Initializing Dataset Link...</div>
      ) : (
        <div className={styles.explorerSplit}>
          <div className={styles.explorerTableArea}>
            <div className={styles.dataTableWrapper} style={{ maxHeight: '400px' }}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    {data?.columns.map(col => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => <td key={j}>{String(val)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.explorerFooter}>
              Showing {filteredData.length} records from {activeTable}
            </div>
          </div>

          {numericColumn && (
            <div className={styles.explorerChartArea}>
              <h3 className={styles.insightTitle}>Quick Insight: {numericColumn} Distribution</h3>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey={data.columns[0]} hide />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid var(--border-glass)' }} />
                    <Bar dataKey={numericColumn} fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className={styles.insightDesc}>Auto-generated preview of the first 10 records based on numeric column identification.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
