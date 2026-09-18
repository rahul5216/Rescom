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
export declare class IdentityManager {
    private currentIdentity;
    constructor(initialIdentity?: UserIdentity);
    /**
     * Create or regenerate local cryptographic identity
     */
    createIdentity(displayName: string, department?: string, semester?: string): UserIdentity;
    getIdentity(): UserIdentity;
    getPublicProfile(): {
        userId: string;
        displayName: string;
        department: string;
        semester: string;
        deviceId: string;
        publicKeyPem: string;
    };
    updateProfile(displayName: string, department: string, semester: string): UserIdentity;
}
