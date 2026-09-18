import React from 'react';
import type { TopologyNode, TopologyLink } from '../types';
import { Network } from 'lucide-react';

interface MeshTopologyViewProps {
  nodes?: TopologyNode[];
  links?: TopologyLink[];
  routes?: any[];
}

export const MeshTopologyView: React.FC<MeshTopologyViewProps> = () => {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Network size={20} color="var(--accent-light)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Mesh Topology
          </h2>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Live peer links, relays, and multi-hop routes
        </p>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.73rem', marginBottom: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#22c55e' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Wi-Fi Direct</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#8b5cf6' }} />
            <span style={{ color: 'var(--text-secondary)' }}>BLE Relay</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3b82f6' }} />
            <span style={{ color: 'var(--text-secondary)' }}>LAN</span>
          </span>
        </div>

        {/* SVG Mesh Graph */}
        <div className="card-elevated" style={{
          width: '100%',
          height: '280px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <svg width="100%" height="100%" viewBox="0 0 440 260">
            {/* Links */}
            <line x1="220" y1="130" x2="120" y2="70" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="5 5" opacity="0.7" />
            <line x1="120" y1="70" x2="60" y2="180" stroke="#8b5cf6" strokeWidth="2.5" strokeDasharray="4 4" opacity="0.7" />
            <line x1="220" y1="130" x2="340" y2="80" stroke="#3b82f6" strokeWidth="2.5" opacity="0.7" />
            <line x1="220" y1="130" x2="360" y2="190" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" />

            {/* Local Node */}
            <g transform="translate(220, 130)">
              <circle r="28" fill="#4f46e5" opacity="0.3" />
              <circle r="22" fill="#6366f1" />
              <text y="-3" fill="#fff" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="Inter, sans-serif">LOCAL</text>
              <text y="8" fill="#c7d2fe" fontSize="6" fontWeight="600" textAnchor="middle" fontFamily="Inter, sans-serif">(You)</text>
            </g>

            {/* Aman */}
            <g transform="translate(120, 70)">
              <circle r="20" fill="#22c55e" />
              <text y="-2" fill="#fff" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="Inter, sans-serif">Aman</text>
              <text y="8" fill="#d1fae5" fontSize="5.5" textAnchor="middle" fontFamily="Inter, sans-serif">Relay</text>
            </g>

            {/* Priya */}
            <g transform="translate(60, 180)">
              <circle r="20" fill="#8b5cf6" />
              <text y="-2" fill="#fff" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="Inter, sans-serif">Priya</text>
              <text y="8" fill="#ede9fe" fontSize="5.5" textAnchor="middle" fontFamily="Inter, sans-serif">Hop #2</text>
            </g>

            {/* Gateway */}
            <g transform="translate(340, 80)">
              <circle r="20" fill="#3b82f6" />
              <text y="-2" fill="#fff" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="Inter, sans-serif">Gateway</text>
              <text y="8" fill="#dbeafe" fontSize="5.5" textAnchor="middle" fontFamily="Inter, sans-serif">Admin</text>
            </g>

            {/* Relay #4 */}
            <g transform="translate(360, 190)">
              <circle r="18" fill="#475569" />
              <text y="-2" fill="#fff" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="Inter, sans-serif">Relay</text>
              <text y="8" fill="#cbd5e1" fontSize="5.5" textAnchor="middle" fontFamily="Inter, sans-serif">#4</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Routing Table */}
      <div className="card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Routing Table
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Destination</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Hops</th>
                <th style={{ padding: '8px 10px', fontWeight: 600 }}>Transport</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>Aman Verma</td>
                <td style={{ padding: '10px' }}><span className="badge badge-success">1 Hop</span></td>
                <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>Wi-Fi Direct</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>Priya Nair</td>
                <td style={{ padding: '10px' }}><span className="badge badge-relay">2 Hops</span></td>
                <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>BLE + Wi-Fi</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>Gateway #1</td>
                <td style={{ padding: '10px' }}><span className="badge badge-success">1 Hop</span></td>
                <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>LAN</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
