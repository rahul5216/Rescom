import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { Shield, Check } from 'lucide-react';

interface SettingsViewProps {
  profile: UserProfile | null;
  onUpdateProfile: (displayName: string, department: string, semester: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const [displayName, setDisplayName] = useState(profile?.displayName || 'Rahul Sharma');
  const [department, setDepartment] = useState(profile?.department || 'Computer Science & Engineering');
  const [semester, setSemester] = useState(profile?.semester || 'Semester 6');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateProfile(displayName, department, semester);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Shield size={20} color="var(--accent-light)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Identity Settings
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              display: 'block',
            }}>
              Display Name
            </label>
            <input
              type="text"
              className="input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <label style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              display: 'block',
            }}>
              Department
            </label>
            <input
              type="text"
              className="input"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            />
          </div>

          <div>
            <label style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              display: 'block',
            }}>
              Semester
            </label>
            <input
              type="text"
              className="input"
              value={semester}
              onChange={e => setSemester(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{ marginTop: '4px', width: '100%' }}
          >
            {saveSuccess && <Check size={16} />}
            <span>
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Profile'}
            </span>
          </button>
        </form>
      </div>

      {/* Device Info */}
      {profile && (
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Device Identity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>User ID</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                {profile.userId.substring(0, 16)}...
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Device ID</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                {profile.deviceId.substring(0, 16)}...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
