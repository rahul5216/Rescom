import React from 'react';
import type { UserProfile } from '../types';
import { User, AlertTriangle, Moon, Sun } from 'lucide-react';

interface TopBarProps {
  profile: UserProfile | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenEmergency: () => void;
  onOpenSettings: () => void;
  activePeerCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  profile,
  theme,
  onToggleTheme,
  onOpenEmergency,
  onOpenSettings,
}) => {
  return (
    <header style={{
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      {/* Theme Toggle */}
      <button
        onClick={onToggleTheme}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '14px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        title="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* User Avatar */}
      <button
        onClick={onOpenSettings}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '14px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        title={profile?.displayName || 'Profile'}
      >
        <User size={20} />
      </button>

      {/* Online Status Dot */}
      <span className="status-dot status-dot-online" />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Emergency Alert Button */}
      <button
        onClick={onOpenEmergency}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'var(--red)',
          border: 'none',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 12px var(--red-glow)',
          transition: 'transform 0.15s ease',
        }}
        title="Emergency Broadcast"
      >
        <AlertTriangle size={16} />
      </button>
    </header>
  );
};

