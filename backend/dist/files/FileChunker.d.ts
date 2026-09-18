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
    fileHash: string;
}
export declare class FileChunker {
    static readonly DEFAULT_CHUNK_SIZE: number;
    /**
     * Split a buffer into FileChunk array + FileMetadata
     */
    static chunkFile(filename: string, buffer: Buffer, mimeType?: string, chunkSize?: number): {
        metadata: FileMetadata;
        chunks: FileChunk[];
    };
    /**
     * Reassemble chunks into a single Buffer and verify SHA-256 integrity
     */
    static reassembleFile(chunks: FileChunk[], expectedHash: string): {
        buffer: Buffer;
        valid: boolean;
    };
}
