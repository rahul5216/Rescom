import { DatabaseSync } from 'node:sqlite';
export declare class CampusDatabase {
    private db;
    constructor(dbPath?: string);
    private initPragmas;
    private createTables;
    getRawDb(): DatabaseSync;
    close(): void;
}
