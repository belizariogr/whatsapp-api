import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth.ts';
import { jsonSuccess } from '../utils/response.ts';
import { sendPdfMessage } from '../modules/message-sender.ts';
import { isValidPhoneNumber } from '../utils/phone.ts';
import { getTenantId } from '../core/services/helpers.ts';

const app = new Hono<{ Variables: AuthVariables }>();

app.post('/messages/pdf', async (c) => {
    const body = await c.req.json<{
        to?: string;
        pdfUrl?: string;
        pdfBase64?: string;
        fileName?: string;
        caption?: string;
    }>();
    if (!isValidPhoneNumber(body.to) || (!body.pdfUrl && !body.pdfBase64)) {
        return c.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid to or pdf source' } },
            400,
        );
    }
    const result = await sendPdfMessage(getTenantId(c), {
        to: body.to!,
        pdfUrl: body.pdfUrl,
        pdfBase64: body.pdfBase64,
        fileName: body.fileName,
        caption: body.caption,
    });
    return jsonSuccess(c, result);
});

export default app;
