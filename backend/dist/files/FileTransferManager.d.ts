import { FileChunk, FileMetadata } from './FileChunker.js';
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
export declare class FileTransferManager {
    private sessions;
    createOutgoingSession(peerId: string, metadata: FileMetadata): TransferSession;
    createIncomingSession(peerId: string, metadata: FileMetadata): TransferSession;
    receiveChunk(chunk: FileChunk): {
        session: TransferSession;
        isComplete: boolean;
    };
    getSession(id: string): TransferSession | undefined;
    getAllSessions(): TransferSession[];
}
