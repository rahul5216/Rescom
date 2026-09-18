"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityManager = void 0;
const CryptoService_js_1 = require("./CryptoService.js");
const uuid_1 = require("uuid");
class IdentityManager {
    currentIdentity = null;
    constructor(initialIdentity) {
        if (initialIdentity) {
            this.currentIdentity = initialIdentity;
        }
    }
    /**
     * Create or regenerate local cryptographic identity
     */
    createIdentity(displayName, department = 'Computer Science', semester = 'Semester 6') {
        const keys = CryptoService_js_1.CryptoService.generateKeyPair();
        const deviceId = CryptoService_js_1.CryptoService.computeDeviceId(keys.publicKeyPem);
        const userId = (0, uuid_1.v4)();
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
    getIdentity() {
        if (!this.currentIdentity) {
            this.createIdentity('Campus User');
        }
        return this.currentIdentity;
    }
    getPublicProfile() {
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
    updateProfile(displayName, department, semester) {
        const id = this.getIdentity();
        id.displayName = displayName;
        id.department = department;
        id.semester = semester;
        return id;
    }
}
exports.IdentityManager = IdentityManager;
