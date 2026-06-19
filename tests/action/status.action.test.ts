import { beforeAll, describe, expect, test } from "bun:test";
import type { ConnectionInfo } from "../../src/modules/types.ts";
import {
    actionRequest,
    authHeaders,
    ensureActionGate,
    getActionData,
    hasActionConfig,
    skipActionTest,
} from "../helpers/action.ts";

describe("action/status", () => {
    beforeAll(() => ensureActionGate());

    test.skipIf(!hasActionConfig)(
        "GET /status — tenant conectado",
        async () => {
            if (skipActionTest()) return;

            const { status, body } = await actionRequest<ConnectionInfo>("/status", {
                headers: authHeaders(),
            });

            expect(status).toBe(200);

            const data = getActionData(body);
            expect(data.status).toBe("logged_in");
            expect(data.connectionStatus).toBe("connected");
            console.log("Connection status:", data);
        },
    );
});
