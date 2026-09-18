import { IdentityManager, UserIdentity } from './crypto/IdentityManager.js';
import { CryptoService } from './crypto/CryptoService.js';
import { SecurityValidator } from './crypto/SecurityValidator.js';
import { MeshRouter } from './mesh/MeshRouter.js';
import { Packet, PacketType, PacketFactory } from './mesh/Packet.js';
import { MessageQueue } from './messaging/MessageQueue.js';
import { DeliveryTracker } from './messaging/DeliveryTracker.js';
import { FileTransferManager } from './files/FileTransferManager.js';
import { FileChunker, FileMetadata } from './files/FileChunker.js';
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

export class PeerNode {
  public identity: IdentityManager;
  public securityValidator: SecurityValidator;
  public router: MeshRouter;
  public queue: MessageQueue;
  public tracker: DeliveryTracker;
  public fileManager: FileTransferManager;
  public lanTransport: LanTransport;
  public bleTransport: SimulatedBleTransport;
  public transportManager: TransportManager;
  public db: CampusDatabase;
  public repo: Repositories;

  // Peer ID -> Symmetric shared secret (derived via ECDH)
  private sessionSecrets: Map<string, Buffer> = new Map();
  private eventListeners: ((event: { type: string; data: any }) => void)[] = [];

  constructor(options: NodeOptions = {}) {
    this.identity = new IdentityManager();
    const id = this.identity.createIdentity(
      options.displayName || 'Campus Student',
      options.department || 'Computer Science',
      options.semester || 'Sem 6'
    );

    this.securityValidator = new SecurityValidator();
    this.router = new MeshRouter(id.userId);
    this.queue = new MessageQueue(5, 1000);
    this.tracker = new DeliveryTracker();
    this.fileManager = new FileTransferManager();

    this.db = new CampusDatabase(options.dbPath);
    this.repo = new Repositories(this.db);

    // Persist local user
    this.repo.saveUser({
      userId: id.userId,
      displayName: id.displayName,
      department: id.department,
      semester: id.semester,
      deviceId: id.deviceId,
      publicKey: id.publicKeyPem,
      createdAt: id.createdAt,
      updatedAt: id.createdAt,
    });

    this.lanTransport = new LanTransport(id.userId);
    this.bleTransport = new SimulatedBleTransport();
    this.transportManager = new TransportManager(this.lanTransport, this.bleTransport);

    // Setup incoming packet dispatcher
    this.transportManager.onPacket((pkt, transport, from) => {
      this.handleIncomingPacket(pkt, from, transport);
    });
  }

  public getLocalId(): string {
    return this.identity.getIdentity().userId;
  }

  public getPublicProfile() {
    return this.identity.getPublicProfile();
  }

  public onEvent(listener: (event: { type: string; data: any }) => void): void {
    this.eventListeners.push(listener);
  }

  private emitEvent(type: string, data: any): void {
    for (const listener of this.eventListeners) {
      listener({ type, data });
    }
  }

  /**
   * Derive or retrieve shared symmetric secret key for a peer using ECDH
   */
  public getOrCreateSharedSecret(peerId: string, peerPublicKeyPem: string): Buffer {
    let secret = this.sessionSecrets.get(peerId);
    if (!secret) {
      const myPrivKey = this.identity.getIdentity().privateKeyPem;
      secret = CryptoService.deriveSharedSecret(myPrivKey, peerPublicKeyPem);
      this.sessionSecrets.set(peerId, secret);
    }
    return secret;
  }

  /**
   * Send a private or group chat message
   */
  public async sendMessage(
    receiverId: string,
    content: string,
    receiverPublicKeyPem?: string,
    isEncrypted = true
  ): Promise<{ messageId: string; status: string; relayHops: number }> {
    const sender = this.identity.getIdentity();
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const convId = `conv-${[sender.userId, receiverId].sort().join('_')}`;

    // Ensure conversation exists in DB
    this.repo.upsertConversation({
      conversationId: convId,
      type: 'PRIVATE',
      title: `Chat with ${receiverId.substring(0, 8)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    let payloadContent: any = content;
    let encrypted = 0;

    if (isEncrypted && receiverPublicKeyPem) {
      const sharedSecret = this.getOrCreateSharedSecret(receiverId, receiverPublicKeyPem);
      const encryptedData = CryptoService.encryptPayload(content, sharedSecret);
      payloadContent = {
        isEncrypted: true,
        encryptedPayload: encryptedData,
      };
      encrypted = 1;
    } else {
      payloadContent = {
        isEncrypted: false,
        text: content,
      };
    }

    // Create Packet
    const packet = PacketFactory.create(
      sender.userId,
      receiverId,
      PacketType.MESSAGE,
      {
        messageId,
        conversationId: convId,
        ...payloadContent,
      },
      5 // TTL: 5 hops
    );

    // Save message locally in DB
    this.repo.saveMessage({
      messageId,
      conversationId: convId,
      senderId: sender.userId,
      receiverId,
      content,
      messageType: 'TEXT',
      status: 'SENDING',
      createdAt: Date.now(),
      isEncrypted: encrypted,
      relayCount: 0,
    });

    this.tracker.trackMessage(messageId, sender.userId, receiverId);

    // Route packet
    const routeResult = this.router.routePacket(packet);

    if (routeResult.status === 'FORWARD' || routeResult.status === 'BROADCAST') {
      const pktToSend = routeResult.forwardedPacket || packet;
      const success = await this.transportManager.sendPacket(pktToSend, routeResult.targetHopId);

      if (success) {
        this.tracker.markSent(messageId, (pktToSend.routeTrace?.length || 1) - 1);
        this.repo.updateMessageStatus(messageId, 'SENT');
      } else {
        // Enqueue in store-and-forward queue
        this.queue.enqueue(packet, receiverId);
        this.repo.updateMessageStatus(messageId, 'QUEUED');
      }
    }

    this.emitEvent('MESSAGE_SENT', { messageId, receiverId, status: 'SENT' });

    return {
      messageId,
      status: 'SENT',
      relayHops: packet.routeTrace?.length || 0,
    };
  }

  /**
   * Broadcast an emergency alert across the entire campus mesh network
   */
  public async sendEmergencyBroadcast(content: string, alertLevel = 'HIGH'): Promise<Packet> {
    const sender = this.identity.getIdentity();
    const signature = CryptoService.signData(content, sender.privateKeyPem);

    const packet = PacketFactory.create(
      sender.userId,
      null, // Broadcast to all nodes
      PacketType.EMERGENCY_BROADCAST,
      {
        alertLevel,
        content,
        senderName: sender.displayName,
        senderDept: sender.department,
        senderDeviceId: sender.deviceId,
        publicKeyPem: sender.publicKeyPem,
        timestamp: Date.now(),
      },
      6, // Higher TTL for emergency broadcast
      signature
    );

    await this.transportManager.sendPacket(packet);
    this.emitEvent('EMERGENCY_BROADCAST', packet);
    return packet;
  }

  /**
   * Send a file to a peer with chunking and SHA-256 verification
   */
  public async offerFile(
    receiverId: string,
    filename: string,
    buffer: Buffer,
    mimeType = 'application/octet-stream'
  ) {
    const { metadata, chunks } = FileChunker.chunkFile(filename, buffer, mimeType);
    const session = this.fileManager.createOutgoingSession(receiverId, metadata);

    // Save transfer in DB
    this.repo.saveFileTransfer({
      transferId: session.transferId,
      filename: metadata.filename,
      mimeType: metadata.mimeType,
      fileSize: metadata.filesize,
      bytesTransferred: 0,
      status: 'IN_PROGRESS',
      createdAt: Date.now(),
    });

    // 1. Send FILE_OFFER packet
    const offerPacket = PacketFactory.create(
      this.getLocalId(),
      receiverId,
      PacketType.FILE_OFFER,
      metadata
    );
    await this.transportManager.sendPacket(offerPacket, receiverId);

    // 2. Send Chunks
    for (const chunk of chunks) {
      const chunkPacket = PacketFactory.create(
        this.getLocalId(),
        receiverId,
        PacketType.FILE_CHUNK,
        chunk
      );
      await this.transportManager.sendPacket(chunkPacket, receiverId);
    }

    this.emitEvent('FILE_TRANSFER_SENT', { transferId: session.transferId, totalChunks: chunks.length });
    return session;
  }

  /**
   * Handle incoming packets from any transport
   */
  public async handleIncomingPacket(packet: Packet, fromPeerId?: string, transport = 'LAN'): Promise<void> {
    // 1. Learn route to source if received via peer
    if (fromPeerId && packet.sourceId !== this.getLocalId()) {
      const hops = (packet.routeTrace?.length || 1);
      this.router.learnRoute(packet.sourceId, fromPeerId, hops, transport);
    }

    // 2. Route evaluation
    const decision = this.router.routePacket(packet, fromPeerId);

    if (decision.status === 'DROPPED_DUPLICATE' || decision.status === 'DROPPED_TTL') {
      return;
    }

    if (decision.status === 'FORWARD' || decision.status === 'BROADCAST') {
      const fwd = decision.forwardedPacket || packet;
      await this.transportManager.sendPacket(fwd, decision.targetHopId);
      // If it's a broadcast, continue to process locally as well!
      if (decision.status !== 'BROADCAST') {
        return;
      }
    }

    // 3. Process local delivery
    await this.processLocalPacket(packet);
  }

  private async processLocalPacket(packet: Packet): Promise<void> {
    switch (packet.type) {
      case PacketType.MESSAGE: {
        const payload = packet.payload;
        let cleartext = '';
        let isEncrypted = 0;

        if (payload.isEncrypted && payload.encryptedPayload) {
          // Derive shared secret
          const senderPeer = this.repo.getPeer(packet.sourceId);
          if (senderPeer && senderPeer.publicKey) {
            try {
              const sharedSecret = this.getOrCreateSharedSecret(packet.sourceId, senderPeer.publicKey);
              cleartext = CryptoService.decryptPayload(payload.encryptedPayload, sharedSecret);
              isEncrypted = 1;
            } catch (err) {
              cleartext = '[DECRYPTION FAILED: Authenticated Tag Mismatch]';
            }
          } else {
            cleartext = '[Encrypted Message: Missing Peer Public Key]';
          }
        } else {
          cleartext = payload.text || '';
        }

        const convId = payload.conversationId || `conv-${[this.getLocalId(), packet.sourceId].sort().join('_')}`;

        this.repo.upsertConversation({
          conversationId: convId,
          type: 'PRIVATE',
          title: `Chat with ${packet.sourceId.substring(0, 8)}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        this.repo.saveMessage({
          messageId: payload.messageId || packet.packetId,
          conversationId: convId,
          senderId: packet.sourceId,
          receiverId: this.getLocalId(),
          content: cleartext,
          messageType: 'TEXT',
          status: 'DELIVERED',
          createdAt: packet.timestamp,
          isEncrypted,
          relayCount: (packet.routeTrace?.length || 1) - 1,
        });

        // Send MESSAGE_ACK back to sender
        const ackPacket = PacketFactory.create(
          this.getLocalId(),
          packet.sourceId,
          PacketType.MESSAGE_ACK,
          {
            originalMessageId: payload.messageId || packet.packetId,
            deliveredAt: Date.now(),
          }
        );
        await this.transportManager.sendPacket(ackPacket, packet.sourceId);

        this.emitEvent('MESSAGE_RECEIVED', {
          messageId: payload.messageId || packet.packetId,
          senderId: packet.sourceId,
          content: cleartext,
          relayCount: (packet.routeTrace?.length || 1) - 1,
        });
        break;
      }

      case PacketType.MESSAGE_ACK: {
        const origId = packet.payload.originalMessageId;
        if (origId) {
          this.tracker.markDelivered(origId);
          this.queue.acknowledge(origId);
          this.repo.updateMessageStatus(origId, 'DELIVERED');
          this.emitEvent('MESSAGE_ACK', { messageId: origId, deliveredAt: packet.payload.deliveredAt });
        }
        break;
      }

      case PacketType.EMERGENCY_BROADCAST: {
        const p = packet.payload;
        let verified = false;
        if (packet.signature && p.publicKeyPem) {
          verified = CryptoService.verifySignature(p.content, packet.signature, p.publicKeyPem);
        }

        this.emitEvent('EMERGENCY_BROADCAST_RECEIVED', {
          ...p,
          signatureVerified: verified,
          relayHops: (packet.routeTrace?.length || 1) - 1,
        });
        break;
      }

      case PacketType.FILE_OFFER: {
        const metadata = packet.payload as FileMetadata;
        this.fileManager.createIncomingSession(packet.sourceId, metadata);
        this.emitEvent('FILE_OFFER_RECEIVED', { metadata, senderId: packet.sourceId });
        break;
      }

      case PacketType.FILE_CHUNK: {
        try {
          const chunk = packet.payload;
          const { session, isComplete } = this.fileManager.receiveChunk(chunk);

          this.emitEvent('FILE_CHUNK_RECEIVED', {
            fileId: chunk.fileId,
            progress: session.progress,
            isComplete,
          });

          if (isComplete) {
            this.repo.saveFileTransfer({
              transferId: session.transferId,
              filename: session.filename,
              mimeType: session.mimeType,
              fileSize: session.filesize,
              bytesTransferred: session.filesize,
              status: 'COMPLETED',
              createdAt: session.startedAt,
              completedAt: Date.now(),
            });
            this.emitEvent('FILE_COMPLETED', { session });
          }
        } catch (err: any) {
          console.error('[PeerNode] Chunk processing error:', err.message);
        }
        break;
      }

      default:
        break;
    }
  }

  public registerPeer(peer: PeerInfo): void {
    this.repo.upsertPeer({
      peerId: peer.peerId,
      displayName: peer.displayName,
      deviceId: peer.deviceId,
      publicKey: peer.publicKeyPem,
      lastSeen: peer.lastSeen,
      connectionState: peer.connectionState,
      preferredTransport: peer.preferredTransport,
      rssi: peer.rssi,
      hopCount: peer.hopCount,
      relayPeerId: peer.relayPeerId,
    });

    if (peer.publicKeyPem) {
      this.getOrCreateSharedSecret(peer.peerId, peer.publicKeyPem);
    }
  }
}
