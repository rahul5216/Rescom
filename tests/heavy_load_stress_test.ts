import { CryptoService } from '../backend/src/crypto/CryptoService.js';
import { SecurityValidator } from '../backend/src/crypto/SecurityValidator.js';
import { MeshRouter } from '../backend/src/mesh/MeshRouter.js';
import { PacketFactory, PacketType } from '../backend/src/mesh/Packet.js';

async function runHeavyLoadStressTest() {
  console.log('\n======================================================');
  console.log('⚡ RUNNING HEAVY SERVER LOAD & ENCRYPTION STRESS TEST');
  console.log('======================================================\n');

  const TOTAL_PACKETS = 2000;
  const CONCURRENCY = 50;

  console.log(`[Config] Total Packets to Process: ${TOTAL_PACKETS}`);
  console.log(`[Config] Concurrency Worker Threads/Batches: ${CONCURRENCY}`);
  console.log(`[Config] Workload: Key Derivation, AES-256-GCM Encrypt, Authenticated Decrypt, Replay Check, Mesh Route Eval\n`);

  // Setup simulated nodes and shared key
  const keysA = CryptoService.generateKeyPair();
  const keysB = CryptoService.generateKeyPair();
  const sharedKey = CryptoService.deriveSharedSecret(keysA.privateKeyPem, keysB.publicKeyPem);

  const localNodeId = 'stress-node-alpha';
  const remoteNodeId = 'stress-node-omega';
  const router = new MeshRouter(localNodeId);
  const validator = new SecurityValidator();

  router.learnRoute(remoteNodeId, 'stress-node-relay-1', 2);

  const latencies: number[] = [];
  let successfulPackets = 0;
  let failedPackets = 0;

  const startTime = performance.now();
  const initialMemory = process.memoryUsage().heapUsed;

  // Process packets in concurrent batches
  const batchSize = Math.ceil(TOTAL_PACKETS / CONCURRENCY);

  const workers = Array.from({ length: CONCURRENCY }, async (_, workerId) => {
    const startIdx = workerId * batchSize;
    const endIdx = Math.min(startIdx + batchSize, TOTAL_PACKETS);

    for (let i = startIdx; i < endIdx; i++) {
      const packetStart = performance.now();
      try {
        // 1. Generate payload
        const plaintext = `Payload #${i}: University Exam Session Authentication Key [Timestamp: ${Date.now()}]`;

        // 2. Heavy Authenticated AES-256-GCM Encryption
        const encrypted = CryptoService.encryptPayload(plaintext, sharedKey);

        // 3. Create Packet
        const packet = PacketFactory.create(
          localNodeId,
          remoteNodeId,
          PacketType.MESSAGE,
          encrypted,
          5
        );

        // 4. Replay Attack & Sequence Validation
        const validSeq = validator.validateSequence(`worker-${workerId}`, i + 1);
        if (!validSeq) throw new Error('Sequence validation failed');

        // 5. Mesh Routing Evaluation
        const routeResult = router.routePacket(packet);
        if (routeResult.status !== 'FORWARD') {
          throw new Error(`Unexpected routing status: ${routeResult.status}`);
        }

        // 6. Decrypt and verify on receiving end
        const decrypted = CryptoService.decryptPayload(packet.payload, sharedKey);
        if (decrypted !== plaintext) {
          throw new Error('Decrypted content mismatch');
        }

        const packetEnd = performance.now();
        latencies.push(packetEnd - packetStart);
        successfulPackets++;
      } catch (err: any) {
        failedPackets++;
      }
    }
  });

  await Promise.all(workers);

  const totalDurationMs = performance.now() - startTime;
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryDeltaMb = Math.round((finalMemory - initialMemory) / (1024 * 1024));

  // Compute Latency Percentiles
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.90)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const throughputRps = Math.round((successfulPackets / (totalDurationMs / 1000)));

  console.log('------------------------------------------------------');
  console.log('📊 PERFORMANCE & STRESS METRICS REPORT');
  console.log('------------------------------------------------------');
  console.log(`Total Packets Processed : ${successfulPackets.toLocaleString()} / ${TOTAL_PACKETS.toLocaleString()}`);
  console.log(`Failed / Dropped Packets : ${failedPackets}`);
  console.log(`Total Elapsed Time       : ${(totalDurationMs / 1000).toFixed(2)}s`);
  console.log(`System Throughput        : ${throughputRps.toLocaleString()} ops/sec (Packets + AES-256-GCM + Routing)`);
  console.log(`Memory Delta             : ${memoryDeltaMb >= 0 ? '+' : ''}${memoryDeltaMb} MB`);
  console.log('------------------------------------------------------');
  console.log('⏱️ LATENCY PERCENTILES');
  console.log('------------------------------------------------------');
  console.log(`Average Latency          : ${avg.toFixed(3)} ms`);
  console.log(`p50 (Median) Latency     : ${p50.toFixed(3)} ms`);
  console.log(`p90 Latency              : ${p90.toFixed(3)} ms`);
  console.log(`p95 Latency              : ${p95.toFixed(3)} ms`);
  console.log(`p99 Latency              : ${p99.toFixed(3)} ms`);
  console.log(`Min Latency              : ${(latencies[0] || 0).toFixed(3)} ms`);
  console.log(`Max Latency              : ${(latencies[latencies.length - 1] || 0).toFixed(3)} ms`);
  console.log('======================================================\n');

  if (failedPackets > 0 || throughputRps < 500) {
    console.error('❌ STRESS TEST FAILED');
    process.exit(1);
  } else {
    console.log('✅ HEAVY LOAD STRESS TEST PASSED WITH DISTINCTION!\n');
  }
}

runHeavyLoadStressTest();
