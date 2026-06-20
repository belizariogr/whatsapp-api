import { describe, expect, test } from 'bun:test';
import { resolveLoginStatus } from '../../../src/modules/login-status.ts';
import type { LoginStatus } from '../../../src/modules/types.ts';

describe('modules/whatsapp/login-status', () => {
    test('logged_in requires credentials', () => {
        const loggedIn: LoginStatus = resolveLoginStatus(true, false);
        const loggedOut: LoginStatus = resolveLoginStatus(false, false);
        expect(loggedIn).toBe('logged_in');
        expect(loggedOut).toBe('logged_out');
    });

    test('active QR login stays qr_pending without credentials', () => {
        const qrPending: LoginStatus = resolveLoginStatus(false, true);
        expect(qrPending).toBe('qr_pending');
    });
});
