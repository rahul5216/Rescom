import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';

interface LoginViewProps {
  onLogin: (username: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(username);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg-base)',
    }}>
      <div className="card" style={{
        maxWidth: '380px',
        width: '100%',
        padding: '36px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--accent-surface)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}>
            <Lock size={28} color="var(--accent-light)" />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: 0,
            color: 'var(--text-primary)',
          }}>
            Rescom
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginTop: '8px',
          }}>
            Sign in to access the mesh network
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '8px',
              display: 'block',
              color: 'var(--text-secondary)',
            }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}>
                <User size={16} />
              </div>
              <input
                type="text"
                className="input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div>
            <label style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '8px',
              display: 'block',
              color: 'var(--text-secondary)',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}>
                <Lock size={16} />
              </div>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || !password || isSubmitting}
            className="btn btn-primary"
            style={{ marginTop: '8px', padding: '14px', width: '100%' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
