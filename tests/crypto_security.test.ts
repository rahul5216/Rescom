import { CryptoService } from '../backend/src/crypto/CryptoService.js';
import { SecurityValidator } from '../backend/src/crypto/SecurityValidator.js';

async function runCryptoSecurityTests() {
  console.log('\n======================================================');
  console.log('🔒 RUNNING RESCOM CRYPTOGRAPHY & SECURITY TESTS');
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

  // TEST 1: Keypair Generation & Device ID
  try {
    const keysA = CryptoService.generateKeyPair();
    const deviceIdA = CryptoService.computeDeviceId(keysA.publicKeyPem);
    assert(keysA.publicKeyPem.includes('BEGIN PUBLIC KEY'), 'Generate valid ECDH/ECDSA Public Key PEM');
    assert(keysA.privateKeyPem.includes('BEGIN PRIVATE KEY'), 'Generate valid Private Key PEM');
    assert(deviceIdA.startsWith('cg-node-'), 'Generate deterministic Device ID from Public Key');
  } catch (err: any) {
    assert(false, `Key generation threw error: ${err.message}`);
  }

  // TEST 2: Asymmetric ECDH Key Agreement
  let sharedSecretA: Buffer = Buffer.alloc(0);
  let sharedSecretB: Buffer = Buffer.alloc(0);
  try {
    const keysA = CryptoService.generateKeyPair();
    const keysB = CryptoService.generateKeyPair();

    // Node A derives shared key with B's public key
    sharedSecretA = CryptoService.deriveSharedSecret(keysA.privateKeyPem, keysB.publicKeyPem);
    // Node B derives shared key with A's public key
    sharedSecretB = CryptoService.deriveSharedSecret(keysB.privateKeyPem, keysA.publicKeyPem);

    assert(sharedSecretA.length === 32, 'Derived 32-byte (256-bit) shared secret');
    assert(sharedSecretA.equals(sharedSecretB), 'ECDH key agreement derives identical symmetric secret');
  } catch (err: any) {
    assert(false, `ECDH agreement threw error: ${err.message}`);
  }

  // TEST 3: Authenticated AES-256-GCM Encryption & Decryption
  try {
    const message = 'Confidential Exam Question Paper #442 - Offline Distribution Only';
    const encrypted = CryptoService.encryptPayload(message, sharedSecretA);

    assert(!!encrypted.iv && !!encrypted.authTag && !!encrypted.ciphertext, 'AES-256-GCM produces IV, Auth Tag, and Ciphertext');

    const decrypted = CryptoService.decryptPayload(encrypted, sharedSecretB);
    assert(decrypted === message, 'Successfully decrypted ciphertext matching original plaintext');
  } catch (err: any) {
    assert(false, `AES-256-GCM test threw error: ${err.message}`);
  }

  // TEST 4: Anti-Tamper Verification (GCM Authentication Tag Enforcement)
  try {
    const message = 'Transfer 1000 Credits to Rahul';
    const encrypted = CryptoService.encryptPayload(message, sharedSecretA);

    // Tamper with ciphertext by modifying a byte
    const cipherBuf = Buffer.from(encrypted.ciphertext, 'base64');
    cipherBuf[0] ^= 0xff; // flip bits
    const tampered = {
      ...encrypted,
      ciphertext: cipherBuf.toString('base64'),
    };

    let tamperDetected = false;
    try {
      CryptoService.decryptPayload(tampered, sharedSecretB);
    } catch {
      tamperDetected = true;
    }

    assert(tamperDetected, 'Tampered ciphertext rejected by AES-GCM authentication tag verification');
  } catch (err: any) {
    assert(false, `Anti-tamper test failed: ${err.message}`);
  }

  // TEST 5: Digital Signatures for Emergency Broadcasts
  try {
    const senderKeys = CryptoService.generateKeyPair();
    const impostorKeys = CryptoService.generateKeyPair();
    const emergencyText = 'FLASH FLOOD ALERT: Evacuate Academic Block 3 immediately.';

    const signature = CryptoService.signData(emergencyText, senderKeys.privateKeyPem);
    assert(signature.length > 30, 'Generated ECDSA SHA-256 digital signature');

    const validVerification = CryptoService.verifySignature(emergencyText, signature, senderKeys.publicKeyPem);
    assert(validVerification === true, 'Legitimate sender signature successfully verified');

    const impostorVerification = CryptoService.verifySignature(emergencyText, signature, impostorKeys.publicKeyPem);
    assert(impostorVerification === false, 'Impostor public key fails signature verification');

    const forgedText = 'ALL CLEAR: Return to classrooms.';
    const tamperedVerification = CryptoService.verifySignature(forgedText, signature, senderKeys.publicKeyPem);
    assert(tamperedVerification === false, 'Modified alert text fails signature verification');
  } catch (err: any) {
    assert(false, `Digital signature test threw error: ${err.message}`);
  }

  // TEST 6: Replay Attack Mitigation (SecurityValidator)
  try {
    const validator = new SecurityValidator();
    const senderId = 'peer-node-101';

    assert(validator.validateSequence(senderId, 1) === true, 'Sequence #1 accepted');
    assert(validator.validateSequence(senderId, 2) === true, 'Sequence #2 accepted');
    assert(validator.validateSequence(senderId, 2) === false, 'Replayed sequence #2 REJECTED');
    assert(validator.validateSequence(senderId, 1) === false, 'Out-of-order sequence #1 REJECTED');
    assert(validator.validateSequence(senderId, 5) === true, 'Fresh higher sequence #5 accepted');
  } catch (err: any) {
    assert(false, `Replay attack test threw error: ${err.message}`);
  }

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runCryptoSecurityTests();
