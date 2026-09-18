import { FileChunk, FileMetadata, FileChunker } from './FileChunker.js';

export interface TransferSession {
  transferId: string;
  fileId: string;
  filename: string;
  filesize: number;
  mimeType: string;
  totalChunks: number;
  peerId: string;
  direction: 'INCOMING' | 'OUTGOING';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  receivedChunks: Map<number, FileChunk>;
  progress: number;
  expectedHash: string;
  startedAt: number;
  completedAt?: number;
  assembledBuffer?: Buffer;
}

export class FileTransferManager {
  private sessions: Map<string, TransferSession> = new Map();

  public createOutgoingSession(
    peerId: string,
    metadata: FileMetadata
  ): TransferSession {
    const session: TransferSession = {
      transferId: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileId: metadata.fileId,
      filename: metadata.filename,
      filesize: metadata.filesize,
      mimeType: metadata.mimeType,
      totalChunks: metadata.totalChunks,
      peerId,
      direction: 'OUTGOING',
      status: 'IN_PROGRESS',
      receivedChunks: new Map(),
      progress: 0,
      expectedHash: metadata.fileHash,
      startedAt: Date.now(),
    };
    this.sessions.set(session.transferId, session);
    return session;
  }

  public createIncomingSession(
    peerId: string,
    metadata: FileMetadata
  ): TransferSession {
    const session: TransferSession = {
      transferId: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileId: metadata.fileId,
      filename: metadata.filename,
      filesize: metadata.filesize,
      mimeType: metadata.mimeType,
      totalChunks: metadata.totalChunks,
      peerId,
      direction: 'INCOMING',
      status: 'IN_PROGRESS',
      receivedChunks: new Map(),
      progress: 0,
      expectedHash: metadata.fileHash,
      startedAt: Date.now(),
    };
    this.sessions.set(session.fileId, session);
    this.sessions.set(session.transferId, session);
    return session;
  }

  public receiveChunk(chunk: FileChunk): { session: TransferSession; isComplete: boolean } {
    const session = this.sessions.get(chunk.fileId);
    if (!session) {
      throw new Error(`No transfer session found for fileId: ${chunk.fileId}`);
    }

    session.receivedChunks.set(chunk.chunkIndex, chunk);
    session.progress = Math.round((session.receivedChunks.size / session.totalChunks) * 100);

    if (session.receivedChunks.size === session.totalChunks) {
      const chunksList = Array.from(session.receivedChunks.values());
      const { buffer, valid } = FileChunker.reassembleFile(chunksList, session.expectedHash);

      if (valid) {
        session.status = 'COMPLETED';
        session.completedAt = Date.now();
        session.assembledBuffer = buffer;
        return { session, isComplete: true };
      } else {
        session.status = 'FAILED';
        throw new Error('Hash verification failed after reassembly');
      }
    }

    return { session, isComplete: false };
  }

  public getSession(id: string): TransferSession | undefined {
    return this.sessions.get(id);
  }

  public getAllSessions(): TransferSession[] {
    // Deduplicate by transferId
    const unique = new Map<string, TransferSession>();
    for (const session of this.sessions.values()) {
      unique.set(session.transferId, session);
    }
    return Array.from(unique.values());
  }
}
