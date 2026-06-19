import { describe, expect, test } from 'bun:test';
import { isLibsignalConsoleNoise } from '../../../src/utils/libsignal-logs.ts';

describe('utils/libsignal-logs', () => {
    test('isLibsignalConsoleNoise detects libsignal debug messages', () => {
        expect(isLibsignalConsoleNoise('Closing session:')).toBe(true);
        expect(isLibsignalConsoleNoise('Opening session:')).toBe(true);
        expect(isLibsignalConsoleNoise('Session already closed')).toBe(true);
        expect(isLibsignalConsoleNoise('Removing old closed session:')).toBe(true);
        expect(isLibsignalConsoleNoise('Migrating session to: v1')).toBe(true);
    });

    test('isLibsignalConsoleNoise ignores unrelated messages', () => {
        expect(isLibsignalConsoleNoise('WhatsApp API running on port 3000')).toBe(false);
        expect(isLibsignalConsoleNoise(null)).toBe(false);
        expect(isLibsignalConsoleNoise(undefined)).toBe(false);
    });
});
