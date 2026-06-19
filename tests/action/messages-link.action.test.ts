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

describe("action/messages/link", () => {
    beforeAll(() => ensureActionGate());

    test.skipIf(!hasActionConfig || !hasRecipient)(
        "POST /messages/link — envio com link",
        async () => {
            if (skipActionTest()) return;

            const { status, body } = await actionRequest<SendResult>("/messages/link", {
                method: "POST",
                headers: jsonAuthHeaders(),
                body: JSON.stringify({
                    to: env.testRecipientPhone,
                    text: "Confira: https://github.com/belizariogr/whatsapp-api",
                }),
            });

            expect(status).toBe(200);

            const data = getActionData(body);
            expect(data.success).toBe(true);
        },
    );
});
