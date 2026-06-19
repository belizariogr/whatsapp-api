import { beforeAll, describe, expect, test } from "bun:test";
import { env } from "../../src/config/env.ts";
import {
    actionRequest,
    ensureActionGate,
    getActionData,
    hasActionConfig,
    hasRecipient,
    jsonAuthHeaders,
    skipActionTest,
    type SendBulkResponse,
} from "../helpers/action.ts";

describe("action/messages/bulk", () => {
    beforeAll(() => ensureActionGate());

    test.skipIf(!hasActionConfig || !hasRecipient)(
        "POST /messages/bulk — envio em massa",
        async () => {
            if (skipActionTest()) return;

            const { status, body } = await actionRequest<SendBulkResponse>("/messages/bulk", {
                method: "POST",
                headers: jsonAuthHeaders(),
                body: JSON.stringify({
                    recipients: [env.testRecipientPhone],
                    message: {
                        type: "text",
                        text: `[Bulk Test] ${new Date().toISOString()}`,
                    },
                }),
            });

            expect(status).toBe(200);

            const data = getActionData(body);
            expect(data.results).toHaveLength(1);
        },
    );
});
