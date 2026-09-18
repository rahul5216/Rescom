import { IdentityManager } from './crypto/IdentityManager.js';
import { SecurityValidator } from './crypto/SecurityValidator.js';
import { MeshRouter } from './mesh/MeshRouter.js';
import { Packet } from './mesh/Packet.js';
import { MessageQueue } from './messaging/MessageQueue.js';
import { DeliveryTracker } from './messaging/DeliveryTracker.js';
import { FileTransferManager } from './files/FileTransferManager.js';
import { TransportManager } from './transport/TransportManager.js';
import { LanTransport } from './transport/LanTransport.js';
import { SimulatedBleTransport } from './transport/SimulatedBleTransport.js';
import { CampusDatabase } from './db/Database.js';
import { Repositories } from './db/Repositories.js';
import { PeerInfo } from './transport/ITransport.js';
export interface NodeOptions {
    displayName?: string;
    department?: string;
    semester?: string;
    dbPath?: string;
}
export declare class PeerNode {
    identity: IdentityManager;
    securityValidator: SecurityValidator;
    router: MeshRouter;
    queue: MessageQueue;
    tracker: DeliveryTracker;
    fileManager: FileTransferManager;
    lanTransport: LanTransport;
    bleTransport: SimulatedBleTransport;
    transportManager: TransportManager;
    db: CampusDatabase;
    repo: Repositories;
    private sessionSecrets;
    private eventListeners;
    constructor(options?: NodeOptions);
    getLocalId(): string;
    getPublicProfile(): {
        userId: string;
        displayName: string;
        department: string;
        semester: string;
        deviceId: string;
        publicKeyPem: string;
    };
    onEvent(listener: (event: {
        type: string;
        data: any;
    }) => void): void;
    private emitEvent;
    /**
     * Derive or retrieve shared symmetric secret key for a peer using ECDH
     */
    getOrCreateSharedSecret(peerId: string, peerPublicKeyPem: string): Buffer;
    /**
     * Send a private or group chat message
     */
    sendMessage(receiverId: string, content: string, receiverPublicKeyPem?: string, isEncrypted?: boolean): Promise<{
        messageId: string;
        status: string;
        relayHops: number;
    }>;
    /**
     * Broadcast an emergency alert across the entire campus mesh network
     */
    sendEmergencyBroadcast(content: string, alertLevel?: string): Promise<Packet>;
    /**
     * Send a file to a peer with chunking and SHA-256 verification
     */
    offerFile(receiverId: string, filename: string, buffer: Buffer, mimeType?: string): Promise<import("./files/FileTransferManager.js").TransferSession>;
    /**
     * Handle incoming packets from any transport
     */
    handleIncomingPacket(packet: Packet, fromPeerId?: string, transport?: string): Promise<void>;
    private processLocalPacket;
    registerPeer(peer: PeerInfo): void;
}
