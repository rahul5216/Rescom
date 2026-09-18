import { CampusDatabase } from './Database.js';

export interface UserRow {
  userId: string;
  displayName: string;
  department: string;
  semester: string;
  deviceId: string;
  publicKey: string;
  profileImageUri?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PeerRow {
  peerId: string;
  displayName: string;
  deviceId: string;
  publicKey?: string;
  lastSeen: number;
  connectionState: string;
  preferredTransport: string;
  rssi?: number;
  hopCount?: number;
  relayPeerId?: string;
}

export interface ConversationRow {
  conversationId: string;
  type: 'PRIVATE' | 'GROUP';
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface MessageRow {
  messageId: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  content: string;
  messageType: string;
  status: string;
  createdAt: number;
  expiresAt?: number;
  isEncrypted: number;
  relayCount: number;
}

export interface FileTransferRow {
  transferId: string;
  messageId?: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  localUri?: string;
  bytesTransferred: number;
  status: string;
  createdAt: number;
  completedAt?: number;
}

export class Repositories {
  private db: CampusDatabase;

  constructor(db: CampusDatabase) {
    this.db = db;
  }

  // --- USER REPOSITORY ---
  public saveUser(user: UserRow): void {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`
      INSERT INTO users (userId, displayName, department, semester, deviceId, publicKey, profileImageUri, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        displayName = excluded.displayName,
        department = excluded.department,
        semester = excluded.semester,
        updatedAt = excluded.updatedAt;
    `);
    stmt.run(
      user.userId,
      user.displayName,
      user.department,
      user.semester,
      user.deviceId,
      user.publicKey,
      user.profileImageUri || '',
      user.createdAt,
      user.updatedAt
    );
  }

  public getUser(userId: string): UserRow | null {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`SELECT * FROM users WHERE userId = ?`);
    const row = stmt.get(userId) as any;
    return row || null;
  }

  // --- PEER REPOSITORY ---
  public upsertPeer(peer: PeerRow): void {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`
      INSERT INTO peers (peerId, displayName, deviceId, publicKey, lastSeen, connectionState, preferredTransport, rssi, hopCount, relayPeerId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(peerId) DO UPDATE SET
        displayName = excluded.displayName,
        lastSeen = excluded.lastSeen,
        connectionState = excluded.connectionState,
        preferredTransport = excluded.preferredTransport,
        rssi = excluded.rssi,
        hopCount = excluded.hopCount,
        relayPeerId = excluded.relayPeerId;
    `);
    stmt.run(
      peer.peerId,
      peer.displayName,
      peer.deviceId,
      peer.publicKey || '',
      peer.lastSeen,
      peer.connectionState,
      peer.preferredTransport,
      peer.rssi || -60,
      peer.hopCount || 1,
      peer.relayPeerId || ''
    );
  }

  public getAllPeers(): PeerRow[] {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`SELECT * FROM peers ORDER BY lastSeen DESC`);
    return (stmt.all() as any[]) || [];
  }

  public getPeer(peerId: string): PeerRow | null {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`SELECT * FROM peers WHERE peerId = ?`);
    const row = stmt.get(peerId) as any;
    return row || null;
  }

  // --- CONVERSATION REPOSITORY ---
  public upsertConversation(conv: ConversationRow): void {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`
      INSERT INTO conversations (conversationId, type, title, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(conversationId) DO UPDATE SET
        title = excluded.title,
        updatedAt = excluded.updatedAt;
    `);
    stmt.run(conv.conversationId, conv.type, conv.title, conv.createdAt, conv.updatedAt);
  }

  public getAllConversations(): ConversationRow[] {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`SELECT * FROM conversations ORDER BY updatedAt DESC`);
    return (stmt.all() as any[]) || [];
  }

  // --- MESSAGE REPOSITORY ---
  public saveMessage(msg: MessageRow): void {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`
      INSERT INTO messages (messageId, conversationId, senderId, receiverId, content, messageType, status, createdAt, expiresAt, isEncrypted, relayCount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(messageId) DO UPDATE SET
        status = excluded.status,
        relayCount = excluded.relayCount;
    `);
    stmt.run(
      msg.messageId,
      msg.conversationId,
      msg.senderId,
      msg.receiverId || '',
      msg.content,
      msg.messageType,
      msg.status,
      msg.createdAt,
      msg.expiresAt || 0,
      msg.isEncrypted,
      msg.relayCount
    );
  }

  public getMessagesForConversation(convId: string): MessageRow[] {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC`);
    return (stmt.all(convId) as any[]) || [];
  }

  public updateMessageStatus(messageId: string, status: string): void {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`UPDATE messages SET status = ? WHERE messageId = ?`);
    stmt.run(status, messageId);
  }

  // --- FILE TRANSFER REPOSITORY ---
  public saveFileTransfer(tx: FileTransferRow): void {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`
      INSERT INTO file_transfers (transferId, messageId, filename, mimeType, fileSize, localUri, bytesTransferred, status, createdAt, completedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(transferId) DO UPDATE SET
        bytesTransferred = excluded.bytesTransferred,
        status = excluded.status,
        completedAt = excluded.completedAt;
    `);
    stmt.run(
      tx.transferId,
      tx.messageId || '',
      tx.filename,
      tx.mimeType,
      tx.fileSize,
      tx.localUri || '',
      tx.bytesTransferred,
      tx.status,
      tx.createdAt,
      tx.completedAt || 0
    );
  }

  public getAllFileTransfers(): FileTransferRow[] {
    const raw = this.db.getRawDb();
    const stmt = raw.prepare(`SELECT * FROM file_transfers ORDER BY createdAt DESC`);
    return (stmt.all() as any[]) || [];
  }
}
