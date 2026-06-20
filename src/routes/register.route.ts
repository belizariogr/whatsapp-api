import { Hono } from 'hono';
import Token from '../core/services/token.ts';
import { createTenant, TenantAlreadyExistsError } from '../modules/tenant-repository.ts';
import { jsonError, jsonSuccess } from '../utils/response.ts';

const app = new Hono();

function parseTenantId(value: unknown): number | undefined | null {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
        return null;
    }
    return value;
}

app.post('/register', async (c) => {
    let body: { id?: unknown; name?: unknown } = {};
    try {
        body = await c.req.json();
    } catch {
        body = {};
    }

    const parsedId = parseTenantId(body.id);
    if (parsedId === null) {
        return jsonError(c, 'VALIDATION_ERROR', 'id must be a positive integer', 400);
    }

    const name = body.name;
    if (name !== undefined && name !== null) {
        if (typeof name !== 'string' || name.trim() === '') {
            return jsonError(c, 'VALIDATION_ERROR', 'name must be a non-empty string', 400);
        }
        if (name.length > 255) {
            return jsonError(c, 'VALIDATION_ERROR', 'name must be at most 255 characters', 400);
        }
    }

    try {
        const tenant = await createTenant({
            id: parsedId,
            name: typeof name === 'string' ? name.trim() : null,
        });
        const token = Token.sign(tenant.id);

        return jsonSuccess(c, {
            tenantId: tenant.id,
            name: tenant.name,
            token,
        }, 201);
    } catch (error) {
        if (error instanceof TenantAlreadyExistsError) {
            return jsonError(c, 'TENANT_EXISTS', error.message, 409);
        }
        const message = error instanceof Error ? error.message : 'Failed to register tenant';
        return jsonError(c, 'REGISTER_ERROR', message, 500);
    }
});

export default app;
