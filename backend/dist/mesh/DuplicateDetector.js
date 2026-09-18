"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateDetector = void 0;
class DuplicateDetector {
    seenPackets = new Map();
    maxCapacity;
    ttlMs;
    constructor(maxCapacity = 10000, ttlMs = 10 * 60 * 1000) {
        this.maxCapacity = maxCapacity;
        this.ttlMs = ttlMs;
    }
    /**
     * Check if packetId has already been seen.
     * If seen, returns true.
     * If fresh, records it and returns false.
     */
    isDuplicate(packetId) {
        const now = Date.now();
        this.cleanupExpired(now);
        if (this.seenPackets.has(packetId)) {
            return true;
        }
        if (this.seenPackets.size >= this.maxCapacity) {
            // Remove oldest entry
            const oldestKey = this.seenPackets.keys().next().value;
            if (oldestKey) {
                this.seenPackets.delete(oldestKey);
            }
        }
        this.seenPackets.set(packetId, now);
        return false;
    }
    cleanupExpired(now) {
        // Only cleanup periodically if size grows
        if (this.seenPackets.size > 100) {
            for (const [key, timestamp] of this.seenPackets.entries()) {
                if (now - timestamp > this.ttlMs) {
                    this.seenPackets.delete(key);
                }
                else {
                    // Since Map iterates in insertion order, we can break early if entries are chronological
                    break;
                }
            }
        }
    }
    clear() {
        this.seenPackets.clear();
    }
}
exports.DuplicateDetector = DuplicateDetector;
