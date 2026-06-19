import { beforeAll, describe, expect, test } from "bun:test";
import { env } from "../../src/config/env.ts";
import type { SendResult } from "../../src/modules/types.ts";
import {
    actionRequest,
    ensureActionGate,
    getActionData,
    hasActionConfig,
    hasRecipient,
    jsonAuthHeaders,
    skipActionTest,
} from "../helpers/action.ts";

/** 1x1 PNG — evita dependência de URL externa no teste base64 */
const TEST_IMAGE_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const IMAGE_ACTION_TIMEOUT_MS = 15_000;

describe("action/messages/image", () => {
    beforeAll(() => ensureActionGate());

    test.skipIf(!hasActionConfig || !hasRecipient)(
        "POST /messages/image — envio por base64",
        async () => {
            if (skipActionTest()) return;

            const { status, body } = await actionRequest<SendResult>("/messages/image", {
                method: "POST",
                headers: jsonAuthHeaders(),
                signal: AbortSignal.timeout(IMAGE_ACTION_TIMEOUT_MS),
                body: JSON.stringify({
                    to: env.testRecipientPhone,
                    imageBase64: TEST_IMAGE_BASE64,
                    caption: `[Teste API] Imagem base64 ${new Date().toISOString()}`,
                }),
            });

            expect(status).toBe(200);

            const data = getActionData(body);
            expect(data.success).toBe(true);
        },
    );

    test.skipIf(!hasActionConfig || !hasRecipient)(
        "POST /messages/image — envio por URL",
        async () => {
            if (skipActionTest()) return;

            const { status, body } = await actionRequest<SendResult>("/messages/image", {
                method: "POST",
                headers: jsonAuthHeaders(),
                signal: AbortSignal.timeout(IMAGE_ACTION_TIMEOUT_MS),
                body: JSON.stringify({
                    to: env.testRecipientPhone,
                    imageUrl: "https://httpbin.org/image/png",
                    caption: `[Teste API] Imagem URL ${new Date().toISOString()}`,
                }),
            });

            expect(status).toBe(200);

            const data = getActionData(body);
            expect(data.success).toBe(true);
        },
    );
});
