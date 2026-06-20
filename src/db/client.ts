import { SQL } from 'bun';
import { env } from '../config/env.ts';

let dbInstance: SQL | null = null;

export function getDb(): SQL {
    if (!dbInstance) {
        dbInstance = new SQL({
            adapter: 'mysql',
            hostname: env.databaseHost,
            port: env.databasePort,
            username: env.databaseUsername,
            password: env.databasePassword,
            database: env.databaseName,
            max: env.databasePoolMax,
            connectionTimeout: 5,
        });
    }
    return dbInstance;
}

export async function closeDb(): Promise<void> {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
    }
}

export async function verifyDbConnection(): Promise<void> {
    const db = getDb();
    await db`SELECT 1`;
}

export async function pingDb(): Promise<boolean> {
    try {
        await verifyDbConnection();
        return true;
    } catch {
        return false;
    }
}
