import React, { useState } from 'react';
import type { Peer } from '../types';
import { Bluetooth, Wifi, Monitor, RefreshCw } from 'lucide-react';

interface PeersViewProps {
  peers: Peer[];
  onStartChat: (peer: Peer) => void;
  onRefresh: () => void;
  isScanning: boolean;
}

/* ── Avatar Colors ── */
const AVATAR_COLORS = [
  '#22c55e', '#ef4444', '#f59e0b', '#ec4899',
  '#6366f1', '#14b8a6', '#8b5cf6', '#3b82f6',
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getTransportLabel(transport?: string): string {
  switch (transport) {
    case 'BLE': return 'BLE';
    case 'WIFI_DIRECT': return 'Wi-Fi Direct';
    case 'LAN': return 'LAN';
    default: return 'Mesh';
  }
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 10000) return 'last seen now';
  if (diff < 60000) return `last seen ${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `last seen ${Math.floor(diff / 60000)}m ago`;
  return `last seen ${Math.floor(diff / 3600000)}h ago`;
}

/* ── Signal Bars Component ── */
const SignalBars: React.FC<{ strength: number }> = ({ strength }) => {
  // strength 0-100
  const bars = strength > 75 ? 4 : strength > 50 ? 3 : strength > 25 ? 2 : 1;
  const color = bars >= 3 ? 'var(--green)' : bars >= 2 ? 'var(--orange)' : 'var(--red)';

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '20px' }}>
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{
            width: '4px',
            height: `${4 + i * 4}px`,
            borderRadius: '1.5px',
            background: i <= bars ? color : 'var(--border-medium)',
            transition: 'background 0.2s',
          }}
        />
      ))}
    </div>
  );
};

/* ── Toggle Switch Component ── */
const ToggleSwitch: React.FC<{
  isOn: boolean;
  onToggle: () => void;
}> = ({ isOn, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        background: isOn
          ? 'var(--green)'
          : 'var(--bg-input)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.25s ease',
        flexShrink: 0,
        boxShadow: isOn ? '0 0 10px var(--green-glow)' : 'none',
      }}
    >
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#ffffff',
        position: 'absolute',
        top: '3px',
        left: isOn ? '23px' : '3px',
        transition: 'left 0.25s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
};

export const PeersView: React.FC<PeersViewProps> = ({
  peers,
  onStartChat,
  onRefresh,
  isScanning,
}) => {
  const [bleEnabled, setBleEnabled] = useState(true);
  const [wifiDirectEnabled, setWifiDirectEnabled] = useState(true);
  const [lanEnabled, setLanEnabled] = useState(false);

  // Count peers by transport
  const blePeerCount = peers.filter(p => p.preferredTransport === 'BLE').length;
  const wifiPeerCount = peers.filter(p => p.preferredTransport === 'WIFI_DIRECT').length;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Network Setting Header ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}>
            Network Setting
          </h2>
          <button
            onClick={onRefresh}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            <RefreshCw size={13} className={isScanning ? 'spin-anim' : ''} />
            <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
          </button>
        </div>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginBottom: '20px',
        }}>
          Manage the transports Rescom uses to hold the mesh together.
        </p>

        {/* ── Transport Cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Bluetooth LE */}
          <div className="card-elevated" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
            }}>
              <Bluetooth size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700,
                fontSize: '0.92rem',
                color: 'var(--text-primary)',
              }}>
                Bluetooth LE
              </div>
              <div style={{
                fontSize: '0.73rem',
                color: 'var(--text-muted)',
                marginTop: '1px',
              }}>
                {bleEnabled
                  ? `${blePeerCount || peers.length} peer${(blePeerCount || peers.length) !== 1 ? 's' : ''} connected · lowest power`
                  : 'Disabled'}
              </div>
            </div>

            {bleEnabled && (
              <span className="badge badge-success" style={{
                padding: '4px 10px',
                fontSize: '0.68rem',
              }}>
                Active
              </span>
            )}

            <ToggleSwitch isOn={bleEnabled} onToggle={() => setBleEnabled(!bleEnabled)} />
          </div>

          {/* Wi-Fi Direct */}
          <div className="card-elevated" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
            }}>
              <Wifi size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700,
                fontSize: '0.92rem',
                color: 'var(--text-primary)',
              }}>
                Wi-Fi Direct
              </div>
              <div style={{
                fontSize: '0.73rem',
                color: 'var(--text-muted)',
                marginTop: '1px',
              }}>
                {wifiDirectEnabled
                  ? (wifiPeerCount > 0
                    ? `${wifiPeerCount} peer${wifiPeerCount !== 1 ? 's' : ''} · best for file transfer`
                    : 'Searching · best for file transfer')
                  : 'Disabled'}
              </div>
            </div>

            {wifiDirectEnabled && (
              <span className="badge" style={{
                padding: '4px 10px',
                fontSize: '0.68rem',
                background: 'rgba(20, 184, 166, 0.15)',
                color: '#2dd4bf',
                border: '1px solid rgba(20, 184, 166, 0.25)',
              }}>
                {wifiPeerCount > 0 ? 'Active' : 'Searching'}
              </span>
            )}

            <ToggleSwitch isOn={wifiDirectEnabled} onToggle={() => setWifiDirectEnabled(!wifiDirectEnabled)} />
          </div>

          {/* Local IP / LAN */}
          <div className="card-elevated" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            opacity: lanEnabled ? 1 : 0.7,
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: lanEnabled
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : 'var(--bg-input)',
              border: lanEnabled ? 'none' : '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: lanEnabled ? '#ffffff' : 'var(--text-muted)',
              flexShrink: 0,
            }}>
              <Monitor size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700,
                fontSize: '0.92rem',
                color: 'var(--text-primary)',
              }}>
                Local IP / LAN
              </div>
              <div style={{
                fontSize: '0.73rem',
                color: 'var(--text-muted)',
                marginTop: '1px',
              }}>
                {lanEnabled ? 'Active · shared access point' : 'Off · needs a shared access point'}
              </div>
            </div>

            {!lanEnabled && (
              <span style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                flexShrink: 0,
              }}>
                Off
              </span>
            )}

            <ToggleSwitch isOn={lanEnabled} onToggle={() => setLanEnabled(!lanEnabled)} />
          </div>
        </div>
      </div>

      {/* ── Nearby Peers Section ── */}
      <div>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '12px',
          paddingLeft: '4px',
        }}>
          Nearby peers
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {peers.length === 0 ? (
            <div className="card" style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}>
              No peers discovered yet. Make sure at least one transport is enabled and tap <strong>Scan</strong>.
            </div>
          ) : (
            peers.map((peer, i) => {
              const rssi = peer.rssi || -60;
              const signalPct = Math.max(10, Math.min(100, Math.round(((rssi + 100) / 70) * 100)));

              return (
                <div
                  key={peer.peerId}
                  className="card-sm"
                  onClick={() => onStartChat(peer)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="avatar-circle"
                    style={{
                      background: getAvatarColor(i),
                      width: '44px',
                      height: '44px',
                      fontSize: '0.82rem',
                    }}
                  >
                    {getInitials(peer.displayName)}
                  </div>

                  {/* Name & Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: 'var(--text-primary)',
                    }}>
                      {peer.displayName}
                    </div>
                    <div style={{
                      fontSize: '0.73rem',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                    }}>
                      {peer.hopCount || 1} hop{(peer.hopCount || 1) > 1 ? 's' : ''}
                      {' · '}
                      {getTransportLabel(peer.preferredTransport)}
                      {' · '}
                      {timeAgo(peer.lastSeen)}
                    </div>
                  </div>

                  {/* Signal Bars */}
                  <SignalBars strength={signalPct} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
