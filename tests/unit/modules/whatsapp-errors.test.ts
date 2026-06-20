import { describe, expect, test } from 'bun:test';
import {
    isWhatsAppApiError,
    TenantAlreadyLoggedInError,
    WhatsAppApiError,
    WhatsAppNotConnectedError,
    WhatsAppNotLoggedInError,
    WhatsAppQrPendingError,
} from '../../../src/modules/types.ts';

describe('modules/types — WhatsAppApiError', () => {
    test('WhatsAppApiError stores code and statusCode', () => {
        const error = new WhatsAppApiError('CUSTOM', 'Something failed', 422);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('WhatsAppApiError');
        expect(error.code).toBe('CUSTOM');
        expect(error.message).toBe('Something failed');
        expect(error.statusCode).toBe(422);
        expect(isWhatsAppApiError(error)).toBe(true);
    });

    test('isWhatsAppApiError returns false for plain Error', () => {
        expect(isWhatsAppApiError(new Error('fail'))).toBe(false);
        expect(isWhatsAppApiError(null)).toBe(false);
    });

    test('WhatsAppNotLoggedInError is a WhatsAppApiError with 401', () => {
        const error = new WhatsAppNotLoggedInError();
        expect(isWhatsAppApiError(error)).toBe(true);
        expect(error.code).toBe('NOT_LOGGED_IN');
        expect(error.statusCode).toBe(401);
    });

    test('WhatsAppNotConnectedError is a WhatsAppApiError with 503', () => {
        const error = new WhatsAppNotConnectedError('Socket disconnected');
        expect(isWhatsAppApiError(error)).toBe(true);
        expect(error.code).toBe('NOT_CONNECTED');
        expect(error.statusCode).toBe(503);
        expect(error.message).toBe('Socket disconnected');
    });

    test('TenantAlreadyLoggedInError is a WhatsAppApiError with 409', () => {
        const error = new TenantAlreadyLoggedInError();
        expect(isWhatsAppApiError(error)).toBe(true);
        expect(error.code).toBe('ALREADY_LOGGED_IN');
        expect(error.statusCode).toBe(409);
    });

    test('WhatsAppQrPendingError is a WhatsAppApiError with 409', () => {
        const error = new WhatsAppQrPendingError();
        expect(isWhatsAppApiError(error)).toBe(true);
        expect(error.code).toBe('QR_PENDING');
        expect(error.statusCode).toBe(409);
    });
});
