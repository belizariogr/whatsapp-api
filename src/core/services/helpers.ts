import type { AuthVariables } from '../../middleware/auth.ts';
import type { Context } from 'hono';

export function getTenantId(c: Context<{ Variables: AuthVariables }>): number {
    return c.get('tenantId');
}
