"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityValidator = void 0;
class SecurityValidator {
    // Session/Peer ID -> Highest received sequence number
    sequenceTracker = new Map();
    // Max time drift allowable in milliseconds (5 minutes)
    maxClockDriftMs = 5 * 60 * 1000;
    /**
     * Validate sequence number to prevent replay attacks
     * Returns true if sequence number is fresh and valid
     */
    validateSequence(senderId, sequence) {
        const lastSeq = this.sequenceTracker.get(senderId);
        if (lastSeq !== undefined && sequence <= lastSeq) {
            // Sequence must be strictly increasing to prevent replay
            return false;
        }
        this.sequenceTracker.set(senderId, sequence);
        return true;
    }
    /**
     * Validate timestamp freshness
     */
    validateFreshness(timestamp) {
        const now = Date.now();
        const diff = Math.abs(now - timestamp);
        return diff <= this.maxClockDriftMs;
    }
    /**
     * Reset tracking for a peer
     */
    resetPeer(senderId) {
        this.sequenceTracker.delete(senderId);
    }
    /**
     * Clear all tracked sequences
     */
    clear() {
        this.sequenceTracker.clear();
    }
}
exports.SecurityValidator = SecurityValidator;
