'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../page.module.css';
import { Database, Lock, User, PlusCircle, ShieldCheck } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      setError('Connection refused. Please try again.');
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
          <h1 className={styles.authTitle}>Initialize Identity</h1>
          <p className={styles.authSubtitle}>Register on the AetherFlow Intelligence Nexus</p>
        </div>

        <form className={styles.authForm} onSubmit={handleSignup}>
          {error && <div className={styles.errorMsg}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>New Credential ID</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                className={styles.authInput} 
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="Choose a Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>New Security Key</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="password" 
                className={styles.authInput} 
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Verify Security Key</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="password" 
                className={styles.authInput} 
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.authButton} disabled={loading}>
            {loading ? 'Propagating Identity...' : 'Sync Identity'} <PlusCircle size={18} style={{ marginLeft: '8px' }} />
          </button>
        </form>

        <div className={styles.authFooter}>
          Already registered? 
          <Link href="/login" className={styles.authLink}>Reconnect Here</Link>
        </div>
      </div>
    </div>
  );
}
