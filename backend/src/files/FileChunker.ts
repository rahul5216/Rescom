import crypto from 'node:crypto';

export interface FileChunk {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
  chunkHash: string;
  dataBase64: string;
}

export interface FileMetadata {
  fileId: string;
  filename: string;
  filesize: number;
  mimeType: string;
  totalChunks: number;
  chunkSize: number;
  fileHash: string; // SHA-256
}

export class FileChunker {
  public static readonly DEFAULT_CHUNK_SIZE = 64 * 1024; // 64 KB

  /**
   * Split a buffer into FileChunk array + FileMetadata
   */
  public static chunkFile(
    filename: string,
    buffer: Buffer,
    mimeType = 'application/octet-stream',
    chunkSize = FileChunker.DEFAULT_CHUNK_SIZE
  ): { metadata: FileMetadata; chunks: FileChunk[] } {
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileId = `file-${fileHash.substring(0, 12)}-${Date.now()}`;
    const totalChunks = Math.max(1, Math.ceil(buffer.length / chunkSize));

    const metadata: FileMetadata = {
      fileId,
      filename,
      filesize: buffer.length,
      mimeType,
      totalChunks,
      chunkSize,
      fileHash,
    };

    const chunks: FileChunk[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, buffer.length);
      const chunkBuf = buffer.subarray(start, end);
      const chunkHash = crypto.createHash('sha256').update(chunkBuf).digest('hex');

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
  public static reassembleFile(chunks: FileChunk[], expectedHash: string): { buffer: Buffer; valid: boolean } {
    // Sort chunks by index
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    const buffers: Buffer[] = [];
    for (const chunk of chunks) {
      const buf = Buffer.from(chunk.dataBase64, 'base64');
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      if (hash !== chunk.chunkHash) {
        throw new Error(`Integrity check failed on chunk ${chunk.chunkIndex}`);
      }
      buffers.push(buf);
    }

    const fullBuffer = Buffer.concat(buffers);
    const calculatedHash = crypto.createHash('sha256').update(fullBuffer).digest('hex');

    return {
      buffer: fullBuffer,
      valid: calculatedHash.toLowerCase() === expectedHash.toLowerCase(),
    };
  }
}
