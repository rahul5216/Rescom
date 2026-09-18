import React, { useState } from 'react';
import { AlertTriangle, X, Radio } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendEmergency: (content: string, alertLevel: string) => Promise<void>;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  onSendEmergency,
}) => {
  const [content, setContent] = useState('');
  const [alertLevel, setAlertLevel] = useState('CRITICAL');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isBroadcasting) return;

    setIsBroadcasting(true);
    try {
      await onSendEmergency(content.trim(), alertLevel);
      setContent('');
      onClose();
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div className="card" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '28px',
        border: '1px solid rgba(239, 68, 68, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              background: 'var(--red)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Emergency Broadcast
              </h2>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Flood across all mesh nodes
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon-sm"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <select
            className="input"
            value={alertLevel}
            onChange={e => setAlertLevel(e.target.value)}
          >
            <option value="CRITICAL">🔴 CRITICAL</option>
            <option value="WARNING">🟡 WARNING</option>
            <option value="ANNOUNCEMENT">🔵 BROADCAST</option>
          </select>

          <textarea
            className="input"
            rows={3}
            placeholder="Type emergency message..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || isBroadcasting}
              className="btn btn-danger"
              style={{ flex: 2 }}
            >
              <Radio size={16} />
              <span>{isBroadcasting ? 'Sending...' : 'Broadcast'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
