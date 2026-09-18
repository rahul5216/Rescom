import React, { useState } from 'react';
import type { FileTransfer, Peer } from '../types';
import { Megaphone, AlertTriangle, Send, FileText, Upload, CheckCircle2, Clock } from 'lucide-react';

interface AnnounceViewProps {
  onSendEmergency: (content: string, alertLevel: string) => Promise<void>;
  fileTransfers: FileTransfer[];
  peers: Peer[];
  onSendFile: (receiverId: string, filename: string, dataBase64: string, mimeType: string) => Promise<void>;
}

export const AnnounceView: React.FC<AnnounceViewProps> = ({
  onSendEmergency,
  fileTransfers,
  peers,
  onSendFile,
}) => {
  const [content, setContent] = useState('');
  const [alertLevel, setAlertLevel] = useState('WARNING');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // File transfer state
  const [selectedPeerId, setSelectedPeerId] = useState(peers[0]?.peerId || '');
  const [demoFileName, setDemoFileName] = useState('Lecture_Notes.pdf');
  const [isTransferring, setIsTransferring] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isBroadcasting) return;
    setIsBroadcasting(true);
    try {
      await onSendEmergency(content.trim(), alertLevel);
      setContent('');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSendFile = async () => {
    if (!selectedPeerId || isTransferring) return;
    setIsTransferring(true);
    try {
      const mockData = 'RESCOM_FILE_STREAM_CHUNK_'.repeat(2000);
      const base64 = btoa(mockData);
      await onSendFile(selectedPeerId, demoFileName, base64, 'application/pdf');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Emergency Broadcast Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'var(--red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Emergency Broadcast
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Flood message across all reachable mesh nodes
            </p>
          </div>
        </div>

        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <select
            className="input"
            value={alertLevel}
            onChange={e => setAlertLevel(e.target.value)}
          >
            <option value="CRITICAL">🔴 CRITICAL — Immediate Action</option>
            <option value="WARNING">🟡 WARNING — Advisory Notice</option>
            <option value="ANNOUNCEMENT">🔵 BROADCAST — General Alert</option>
          </select>

          <textarea
            className="input"
            rows={3}
            placeholder="Type emergency message..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          <button
            type="submit"
            disabled={!content.trim() || isBroadcasting}
            className="btn btn-danger"
            style={{ width: '100%' }}
          >
            <Megaphone size={16} />
            <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast to Mesh'}</span>
          </button>
        </form>
      </div>

      {/* File Transfer Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'var(--accent-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-light)',
          }}>
            <Send size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              P2P File Transfer
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              64KB chunked transfer with SHA-256 verification
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <select
            className="input"
            value={selectedPeerId}
            onChange={e => setSelectedPeerId(e.target.value)}
          >
            {peers.map(p => (
              <option key={p.peerId} value={p.peerId}>
                {p.displayName} ({p.preferredTransport})
              </option>
            ))}
          </select>

          <input
            type="text"
            className="input"
            value={demoFileName}
            onChange={e => setDemoFileName(e.target.value)}
            placeholder="File name..."
          />

          <button
            onClick={handleSendFile}
            disabled={isTransferring || !selectedPeerId}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            <Upload size={16} />
            <span>{isTransferring ? 'Sending...' : 'Send File'}</span>
          </button>
        </div>
      </div>

      {/* Transfer History */}
      {fileTransfers.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Transfer History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fileTransfers.map(tx => (
              <div key={tx.transferId} className="card-elevated" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} color="var(--accent-light)" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tx.filename}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {(tx.fileSize / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                {tx.status === 'COMPLETED' ? (
                  <span className="badge badge-success">
                    <CheckCircle2 size={12} /> Done
                  </span>
                ) : (
                  <span className="badge badge-warning">
                    <Clock size={12} /> {tx.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
