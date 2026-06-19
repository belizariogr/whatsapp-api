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

describe("action/messages/buttons", () => {
    beforeAll(() => ensureActionGate());

    test.skipIf(!hasActionConfig || !hasRecipient)(
        "POST /messages/buttons — botões de resposta",
        async () => {
            if (skipActionTest()) return;

            const { status, body } = await actionRequest<SendResult>("/messages/buttons", {
                method: "POST",
                headers: jsonAuthHeaders(),
                body: JSON.stringify({
                    to: env.testRecipientPhone,
                    text: "Escolha uma opção:",
                    footer: "Teste API",
                    buttons: [
                        { id: "opt_sim", text: "Sim" },
                        { id: "opt_nao", text: "Não" },
                    ],
                }),
            });

            expect(status).toBe(200);

            const data = getActionData(body);
            expect(data.success).toBe(true);
        },
    );
});
