import { getDb } from '../db/client.ts';

export interface TenantRecord {
    id: number;
    name: string | null;
}

export class TenantAlreadyExistsError extends Error {
    constructor(tenantId: number) {
        super(`Tenant ${tenantId} already exists`);
        this.name = 'TenantAlreadyExistsError';
    }
}

async function getNextTenantId(): Promise<number> {
    const db = getDb();
    const rows = await db`SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM tenants`;
    return Number(rows[0]?.next_id);
}

export async function createTenant(options?: {
    id?: number;
    name?: string | null;
}): Promise<TenantRecord> {
    const db = getDb();
    const name = options?.name ?? null;
    const id = options?.id ?? (await getNextTenantId());

    if (options?.id !== undefined) {
        const existing = await getTenant(id);
        if (existing) {
            throw new TenantAlreadyExistsError(id);
        }
    }

    await db`
        INSERT INTO tenants (id, name)
        VALUES (${id}, ${name})
    `;

    return { id, name };
}

export async function getTenant(tenantId: number): Promise<TenantRecord | null> {
    const db = getDb();
    const rows = await db`
        SELECT id, name
        FROM tenants
        WHERE id = ${tenantId}
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    return {
        id: Number(row.id),
        name: row.name as string | null,
    };
}

export async function deleteTenant(tenantId: number): Promise<boolean> {
    const db = getDb();
    const existing = await getTenant(tenantId);
    if (!existing) return false;
    await db`DELETE FROM tenants WHERE id = ${tenantId}`;
    return true;
}
