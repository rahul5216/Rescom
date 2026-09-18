"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileChunker = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
class FileChunker {
    static DEFAULT_CHUNK_SIZE = 64 * 1024; // 64 KB
    /**
     * Split a buffer into FileChunk array + FileMetadata
     */
    static chunkFile(filename, buffer, mimeType = 'application/octet-stream', chunkSize = FileChunker.DEFAULT_CHUNK_SIZE) {
        const fileHash = node_crypto_1.default.createHash('sha256').update(buffer).digest('hex');
        const fileId = `file-${fileHash.substring(0, 12)}-${Date.now()}`;
        const totalChunks = Math.max(1, Math.ceil(buffer.length / chunkSize));
        const metadata = {
            fileId,
            filename,
            filesize: buffer.length,
            mimeType,
            totalChunks,
            chunkSize,
            fileHash,
        };
        const chunks = [];
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, buffer.length);
            const chunkBuf = buffer.subarray(start, end);
            const chunkHash = node_crypto_1.default.createHash('sha256').update(chunkBuf).digest('hex');
            chunks.push({
                fileId,
                chunkIndex: i,
                totalChunks,
                chunkSize: chunkBuf.length,
                chunkHash,
                dataBase64: chunkBuf.toString('base64'),
            });
        }
        return { metadata, chunks };
    }
    /**
     * Reassemble chunks into a single Buffer and verify SHA-256 integrity
     */
    static reassembleFile(chunks, expectedHash) {
        // Sort chunks by index
        chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
        const buffers = [];
        for (const chunk of chunks) {
            const buf = Buffer.from(chunk.dataBase64, 'base64');
            const hash = node_crypto_1.default.createHash('sha256').update(buf).digest('hex');
            if (hash !== chunk.chunkHash) {
                throw new Error(`Integrity check failed on chunk ${chunk.chunkIndex}`);
            }
            buffers.push(buf);
        }
        const fullBuffer = Buffer.concat(buffers);
        const calculatedHash = node_crypto_1.default.createHash('sha256').update(fullBuffer).digest('hex');
        return {
            buffer: fullBuffer,
            valid: calculatedHash.toLowerCase() === expectedHash.toLowerCase(),
        };
    }
}
exports.FileChunker = FileChunker;
