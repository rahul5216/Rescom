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
export declare class Repositories {
    private db;
    constructor(db: CampusDatabase);
    saveUser(user: UserRow): void;
    getUser(userId: string): UserRow | null;
    upsertPeer(peer: PeerRow): void;
    getAllPeers(): PeerRow[];
    getPeer(peerId: string): PeerRow | null;
    upsertConversation(conv: ConversationRow): void;
    getAllConversations(): ConversationRow[];
    saveMessage(msg: MessageRow): void;
    getMessagesForConversation(convId: string): MessageRow[];
    updateMessageStatus(messageId: string, status: string): void;
    saveFileTransfer(tx: FileTransferRow): void;
    getAllFileTransfers(): FileTransferRow[];
}
