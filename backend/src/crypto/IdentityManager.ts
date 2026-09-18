import { CryptoService, KeyPairResult } from './CryptoService.js';
import { v4 as uuidv4 } from 'uuid';

export interface UserIdentity {
  userId: string;
  displayName: string;
  department: string;
  semester: string;
  deviceId: string;
  publicKeyPem: string;
  privateKeyPem: string;
  createdAt: number;
}

export class IdentityManager {
  private currentIdentity: UserIdentity | null = null;

  constructor(initialIdentity?: UserIdentity) {
    if (initialIdentity) {
      this.currentIdentity = initialIdentity;
    }
  }

  /**
   * Create or regenerate local cryptographic identity
   */
  public createIdentity(displayName: string, department = 'Computer Science', semester = 'Semester 6'): UserIdentity {
    const keys: KeyPairResult = CryptoService.generateKeyPair();
    const deviceId = CryptoService.computeDeviceId(keys.publicKeyPem);
    const userId = uuidv4();

    this.currentIdentity = {
      userId,
      displayName,
      department,
      semester,
      deviceId,
      publicKeyPem: keys.publicKeyPem,
      privateKeyPem: keys.privateKeyPem,
      createdAt: Date.now(),
    };

    return this.currentIdentity;
  }

  public getIdentity(): UserIdentity {
    if (!this.currentIdentity) {
      this.createIdentity('Campus User');
    }
    return this.currentIdentity!;
  }

  public getPublicProfile() {
    const id = this.getIdentity();
    return {
      userId: id.userId,
      displayName: id.displayName,
      department: id.department,
      semester: id.semester,
      deviceId: id.deviceId,
      publicKeyPem: id.publicKeyPem,
    };
  }

  public updateProfile(displayName: string, department: string, semester: string) {
    const id = this.getIdentity();
    id.displayName = displayName;
    id.department = department;
    id.semester = semester;
    return id;
  }
}
