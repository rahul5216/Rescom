import { MeshRouter } from '../backend/src/mesh/MeshRouter.js';
import { PacketFactory, PacketType, Packet } from '../backend/src/mesh/Packet.js';
import { MessageQueue } from '../backend/src/messaging/MessageQueue.js';
import { FileChunker } from '../backend/src/files/FileChunker.js';

async function runMeshRoutingTests() {
  console.log('\n======================================================');
  console.log('🌐 RUNNING RESCOM MESH ROUTING & QUEUE TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // SIMULATE 4 CAMPUS NODES:
  // Node A (Hostel) ── Node B (Cafeteria) ── Node C (Library) ── Node D (Admin)
  const nodeA_Id = 'node-A-hostel';
  const nodeB_Id = 'node-B-cafeteria';
  const nodeC_Id = 'node-C-library';
  const nodeD_Id = 'node-D-admin';

  const routerA = new MeshRouter(nodeA_Id);
  const routerB = new MeshRouter(nodeB_Id);
  const routerC = new MeshRouter(nodeC_Id);
  const routerD = new MeshRouter(nodeD_Id);

  // Setup routing tables
  // A knows D is reachable via B
  routerA.learnRoute(nodeD_Id, nodeB_Id, 3);
  // B knows D is reachable via C
  routerB.learnRoute(nodeD_Id, nodeC_Id, 2);
  // C knows D is direct neighbor
  routerC.learnRoute(nodeD_Id, nodeD_Id, 1);

  // TEST 1: Multi-Hop Forwarding Across A -> B -> C -> D
  try {
    const originalPacket = PacketFactory.create(
      nodeA_Id,
      nodeD_Id,
      PacketType.MESSAGE,
      { text: 'Rescom Multi-Hop Test Packet' },
      5 // TTL = 5
    );

    // Step 1: Hop 1 - Node A sends towards D
    const resultHop1 = routerA.routePacket(originalPacket);
    assert(resultHop1.status === 'FORWARD', 'Node A routes forward toward next hop');
    assert(resultHop1.targetHopId === nodeB_Id, 'Node A selects Node B as next hop');

    const pktAtB = resultHop1.forwardedPacket!;
    assert(pktAtB.ttl === 4, 'TTL decremented from 5 to 4 at Hop 1');
    assert(pktAtB.routeTrace?.includes(nodeA_Id) === true, 'Node A appended to route trace');

    // Step 2: Hop 2 - Node B forwards towards D
    const resultHop2 = routerB.routePacket(pktAtB, nodeA_Id);
    assert(resultHop2.status === 'FORWARD', 'Node B routes forward toward next hop');
    assert(resultHop2.targetHopId === nodeC_Id, 'Node B selects Node C as next hop');

    const pktAtC = resultHop2.forwardedPacket!;
    assert(pktAtC.ttl === 3, 'TTL decremented from 4 to 3 at Hop 2');

    // Step 3: Hop 3 - Node C forwards towards D
    const resultHop3 = routerC.routePacket(pktAtC, nodeB_Id);
    assert(resultHop3.status === 'FORWARD', 'Node C routes forward toward destination');
    assert(resultHop3.targetHopId === nodeD_Id, 'Node C selects Node D as direct target');

    const pktAtD = resultHop3.forwardedPacket!;
    assert(pktAtD.ttl === 2, 'TTL decremented from 3 to 2 at Hop 3');

    // Step 4: Destination - Node D receives packet
    const resultHop4 = routerD.routePacket(pktAtD, nodeC_Id);
    assert(resultHop4.status === 'DELIVER_LOCAL', 'Node D successfully delivers packet locally');
    assert(pktAtD.routeTrace?.length === 4, 'Route trace contains complete path [A, B, C]');
  } catch (err: any) {
    assert(false, `Multi-hop routing failed: ${err.message}`);
  }

  // TEST 2: TTL Expiration Drops Packet
  try {
    const expiredPacket = PacketFactory.create(
      nodeA_Id,
      nodeD_Id,
      PacketType.MESSAGE,
      { text: 'Should Expire' },
      2 // Insufficient TTL for a 3-hop journey
    );

    const hop1 = routerA.routePacket(expiredPacket);
    const pktAtB = hop1.forwardedPacket!; // TTL becomes 1

    const hop2 = routerB.routePacket(pktAtB, nodeA_Id);
    assert(hop2.status === 'DROPPED_TTL', 'Packet dropped when TTL drops to 1 before reaching destination');
  } catch (err: any) {
    assert(false, `TTL test failed: ${err.message}`);
  }

  // TEST 3: Duplicate Packet Detection
  try {
    const testPkt = PacketFactory.create(
      nodeA_Id,
      nodeB_Id,
      PacketType.MESSAGE,
      { text: 'Broadcast message' }
    );

    const firstEval = routerB.routePacket(testPkt);
    assert(firstEval.status === 'DELIVER_LOCAL', 'First instance of packet processed');

    const duplicateEval = routerB.routePacket(testPkt);
    assert(duplicateEval.status === 'DROPPED_DUPLICATE', 'Duplicate packet ID rejected and dropped');
  } catch (err: any) {
    assert(false, `Duplicate test failed: ${err.message}`);
  }

  // TEST 4: Store-and-Forward Message Queue & Retries
  try {
    const queue = new MessageQueue(3, 100);
    const offlinePacket = PacketFactory.create(
      nodeA_Id,
      'offline-peer-99',
      PacketType.MESSAGE,
      { text: 'Offline queued note' }
    );

    const queued = queue.enqueue(offlinePacket, 'offline-peer-99');
    assert(queue.getQueueLength() === 1, 'Message queued in store-and-forward buffer');

    // Record failed attempt
    const attempt1 = queue.recordAttempt(offlinePacket.packetId, false);
    assert(attempt1 === true, 'First attempt recorded, exponential backoff scheduled');

    // Acknowledge delivery
    const acked = queue.acknowledge(offlinePacket.packetId);
    assert(acked === true, 'Message acknowledged and pruned from queue');
    assert(queue.getQueueLength() === 0, 'Queue empty after delivery acknowledgement');
  } catch (err: any) {
    assert(false, `Message queue test failed: ${err.message}`);
  }

  // TEST 5: File Chunking & SHA-256 Integrity Verification
  try {
    const sampleContent = Buffer.from('Rescom Decentralized File Transfer Verification Payload '.repeat(1000)); // ~60KB
    const { metadata, chunks } = FileChunker.chunkFile('campus_map.pdf', sampleContent, 'application/pdf', 16 * 1024);

    assert(chunks.length === 4, 'File correctly divided into 4 chunks');
    assert(metadata.fileHash.length === 64, 'Computed valid SHA-256 file hash');

    const reassembled = FileChunker.reassembleFile(chunks, metadata.fileHash);
    assert(reassembled.valid === true, 'Reassembled file verified against SHA-256 checksum');
    assert(reassembled.buffer.equals(sampleContent), 'Reassembled file buffer matches original byte-for-byte');
  } catch (err: any) {
    assert(false, `File chunking test failed: ${err.message}`);
  }

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runMeshRoutingTests();
