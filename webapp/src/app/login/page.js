'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../page.module.css';
import { Database, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Store session in localStorage for DBMS Capstone simplicity
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection refused. Is the database online?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={`${styles.logoBadge} ${styles.authLogo}`}>
            <ShieldCheck size={32} />
          </div>
          <h1 className={styles.authTitle}>Neural Link Login</h1>
          <p className={styles.authSubtitle}>Access the Supply Chain Intelligence Grid</p>
        </div>

        <form className={styles.authForm} onSubmit={handleLogin}>
          {error && <div className={styles.errorMsg}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Credential ID</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                className={styles.authInput} 
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Security Key</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="password" 
                className={styles.authInput} 
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.authButton} disabled={loading}>
            {loading ? 'Decrypting Access...' : 'Authenticate'} <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </form>

        <div className={styles.authFooter}>
          Don't have a neural link? 
          <Link href="/signup" className={styles.authLink}>Initialize Account</Link>
        </div>
      </div>
    </div>
  );
}
