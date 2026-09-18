import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export class CampusDatabase {
  private db: DatabaseSync;

  constructor(dbPath?: string) {
    if (dbPath && dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.db = new DatabaseSync(dbPath);
    } else {
      this.db = new DatabaseSync(':memory:');
    }

    this.initPragmas();
    this.createTables();
  }

  private initPragmas(): void {
    // Enable WAL mode and foreign keys for high performance
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        displayName TEXT NOT NULL,
        department TEXT,
        semester TEXT,
        deviceId TEXT NOT NULL,
        publicKey TEXT NOT NULL,
        profileImageUri TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS peers (
        peerId TEXT PRIMARY KEY,
        displayName TEXT NOT NULL,
        deviceId TEXT NOT NULL,
        publicKey TEXT,
        lastSeen INTEGER NOT NULL,
        connectionState TEXT NOT NULL,
        preferredTransport TEXT NOT NULL,
        rssi INTEGER DEFAULT -60,
        hopCount INTEGER DEFAULT 1,
        relayPeerId TEXT
      );

      CREATE TABLE IF NOT EXISTS conversations (
        conversationId TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'PRIVATE' | 'GROUP'
        title TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        messageId TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        receiverId TEXT,
        content TEXT NOT NULL,
        messageType TEXT NOT NULL, -- 'TEXT' | 'FILE' | 'EMERGENCY'
        status TEXT NOT NULL,      -- 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED'
        createdAt INTEGER NOT NULL,
        expiresAt INTEGER,
        isEncrypted INTEGER DEFAULT 1,
        relayCount INTEGER DEFAULT 0,
        FOREIGN KEY (conversationId) REFERENCES conversations(conversationId)
      );

      CREATE TABLE IF NOT EXISTS file_transfers (
        transferId TEXT PRIMARY KEY,
        messageId TEXT,
        filename TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        localUri TEXT,
        bytesTransferred INTEGER DEFAULT 0,
        status TEXT NOT NULL,      -- 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
        createdAt INTEGER NOT NULL,
        completedAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS connection_sessions (
        sessionId TEXT PRIMARY KEY,
        peerId TEXT NOT NULL,
        transport TEXT NOT NULL,
        state TEXT NOT NULL,
        startedAt INTEGER NOT NULL,
        lastActivity INTEGER NOT NULL
      );
    `);
  }

  public getRawDb(): DatabaseSync {
    return this.db;
  }

  public close(): void {
    this.db.close();
  }
}
