export interface UserProfile {
  userId: string;
  displayName: string;
  department: string;
  semester: string;
  deviceId: string;
  publicKeyPem: string;
}

export interface Peer {
  peerId: string;
  displayName: string;
  deviceId: string;
  publicKey?: string;
  lastSeen: number;
  connectionState: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'UNVERIFIED';
  preferredTransport: 'BLE' | 'WIFI_DIRECT' | 'LAN';
  rssi?: number;
  hopCount?: number;
  relayPeerId?: string;
}

export interface Conversation {
  conversationId: string;
  type: 'PRIVATE' | 'GROUP';
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  content: string;
  messageType: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  createdAt: number;
  expiresAt?: number;
  isEncrypted: number;
  relayCount: number;
}

export interface FileTransfer {
  transferId: string;
  messageId?: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  localUri?: string;
  bytesTransferred: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: number;
  completedAt?: number;
}

export interface TopologyNode {
  id: string;
  label: string;
  isLocal: boolean;
  status: string;
  hopCount?: number;
  transport?: string;
}

export interface TopologyLink {
  source: string;
  target: string;
  type: string;
  direct: boolean;
}

export interface LoadTestReport {
  totalRequests: number;
  completed: number;
  errors: number;
  totalDurationMs: number;
  requestsPerSecond: number;
  latency: {
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    minMs: number;
    maxMs: number;
  };
  system: {
    memoryUsageMb: number;
    uptimeSeconds: number;
  };
}
