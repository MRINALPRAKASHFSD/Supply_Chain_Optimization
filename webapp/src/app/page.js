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

const COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#ec4899'];

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
  const router = useRouter();

  useEffect(() => {
    // Session Guard: Check localStorage for DBMS Mock Session
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));

    fetch('/api/analytics')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.data);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
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

  if (!data) return <div className={styles.error}>System Offline: Initialize Database Seeding.</div>;

  return (
    <main className={styles.main}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className="animate-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className={styles.logoBadge}><LayoutDashboard size={20} /></div>
            <h1 className={styles.title}>Supply Chain DBMS [Hyper-Enterprise]</h1>
          </div>
          <p className={styles.subtitle}>Relational Analytics, SQL Triggers & Big Data Optimization</p>
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
          <div className="badge badge-success" style={{ background: '#10b981', color: '#020617', fontWeight: 700 }}>
            <Database size={14} /> {data.metadata.totalRecords}+ Records Live
          </div>
          <div className={styles.timeBadge}>Hyper-Grid Status: {data.metadata.lastUpdated}</div>
        </div>
      </header>

      {/* Database Health Bar (14 Tables) */}
      <section className={`glass-panel ${styles.healthBar}`}>
        <div className={styles.healthTitle}>
          <Activity size={18} />
          <span>Big Data Integrity Monitor: [14 Relational Tables Active]</span>
        </div>
        <div className={styles.tableStats}>
          {Object.entries(data.metadata.tables).map(([name, count]) => (
            <div key={name} className={styles.statItem}>
              <span className={styles.statLabel}>{name}</span>
              <span className={styles.statValue}>{count}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.dashboardGrid}>
        
        {/* 1. Predictive Stock Depletion - ADVANCED SQL */}
        <section className={`glass-panel ${styles.span8} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <Clock className={styles.widgetIcon} />
            Next-Gen Predictive Stock-Out (SQL CTE)
          </h2>
          <SQLReference sql={`WITH Consumption AS (...) SELECT p.ProductName, ROUND(il.QuantityOnHand / (c.TotalOut / c.TxCount), 1) as EstimatedDays FROM InventoryLevels...`} />
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stockOutPrediction} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} label={{ value: 'Estimated Days to Zero', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} />
                <YAxis dataKey="ProductName" type="category" stroke="#94a3b8" fontSize={10} width={120} />
                <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid var(--border-glass)' }} />
                <Bar dataKey="EstimatedDays" name="Days to Stockout" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 2. Manufacturing Quality Audit - NEW TABLE PIE */}
        <section className={`glass-panel ${styles.span4} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <ShieldCheck className={styles.widgetIcon} />
            Quality Audit (Table: QualityChecks)
          </h2>
          <SQLReference sql="SELECT Status, COUNT(*), ROUND(COUNT(*) * 100.0 / Total, 1) FROM QualityChecks GROUP BY Status" />
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.qualityAudit}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="Count"
                  nameKey="Status"
                >
                  {data.qualityAudit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Status === 'PASS' ? '#10b981' : entry.Status === 'FAIL' ? '#ef4444' : '#6366f1'} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.logisticsEfficiency}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="TransportMode" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip />
                <Bar dataKey="avgCost" name="Avg Shipping Cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 4. Financial Health - REVENUE TRENDS */}
        <section className={`glass-panel ${styles.span6} animate-in`}>
          <h2 className={styles.widgetTitle}>
            <TrendingUp className={styles.widgetIcon} />
            Revenue Velocity (Table: Orders)
          </h2>
          <SQLReference sql="SELECT strftime('%Y-%m', OrderDate), SUM(TotalAmount) FROM Orders GROUP BY 1" />
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.financialTrends}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 5. LIVE SQL CONSOLE - INTERACTIVE RUNTIME */}
        <SqlConsole className={styles.span8} />

        {/* 6. UPLOAD CENTER - DYNAMIC DATA INGESTION */}
        <UploadCenter className={styles.span4} />

      </div>

      <footer className={styles.footer}>
        <div style={{ display: 'flex', gap: 20 }}>
          <SQLReference title="Enterprise ERD Setup" sql="-- 14 Tables Implemented: Categories, Suppliers, Manufacturers, Distributors, Warehouses, Products, ProductSuppliers, InventoryLevels, Orders, Logistics, InventoryTransactions, Users, QualityChecks, MaintenanceLogs" />
          <SQLReference title="Automation Trigger" sql="CREATE TRIGGER trg_CreateLogistics AFTER INSERT ON Orders BEGIN INSERT INTO Logistics ... END;" />
        </div>
        <p>&copy; 2024 DBMS Capstone: Supply Chain Hyper-Intelligence Engine</p>
      </footer>
    </main>
  );
}

// Interactive Data Upload Component
const UploadCenter = ({ className }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [msg, setMsg] = useState('');

  const handleFile = (e) => setFile(e.target.files[0]);

  const uploadData = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      // Basic CSV parser mock (Simulating client-side processing before API)
      const text = await file.text();
      const rows = text.split('\n').filter(r => r.trim()).map(r => r.split(','));
      const headers = rows[0];
      const jsonData = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = row[i]?.trim());
        return obj;
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, data: jsonData })
      });
      const d = await res.json();
      if (d.success) {
        setStatus('success');
        setMsg(d.message);
      } else {
        throw new Error(d.error);
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
          <input type="file" onChange={handleFile} accept=".csv" id="file-upload" className={styles.hiddenFile} />
          <label htmlFor="file-upload" className={styles.fileLabel}>
            <Share2 size={32} style={{ marginBottom: 10, color: '#6366f1' }} />
            <span>{file ? file.name : 'Drop CSV / Custom Data Here'}</span>
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

