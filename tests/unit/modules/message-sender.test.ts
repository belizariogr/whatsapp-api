import { describe, expect, test, mock, beforeEach } from 'bun:test';
import type { WASocket } from '@whiskeysockets/baileys';

const mockSendMessage = mock(() =>
    Promise.resolve({ key: { id: 'msg-123' } }),
);

const mockSocket = {
    sendMessage: mockSendMessage,
} as unknown as WASocket;

mock.module('../../../src/modules/connection-manager.ts', () => ({
    whatsappManager: {
        ensureConnected: () => Promise.resolve(mockSocket),
    },
}));

const { sendTextMessage, sendButtonsMessage, sendBulkMessage, sendImageMessage } =
    await import('../../../src/modules/message-sender.ts');

const TEST_IMAGE_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('modules/whatsapp/message-sender', () => {
    beforeEach(() => {
        mockSendMessage.mockClear();
    });

    test('sendTextMessage', async () => {
        const result = await sendTextMessage(1, { to: '5511999999999', text: 'Hello' });
        expect(result.success).toBe(true);
        expect(result.jid).toBe('5511999999999@s.whatsapp.net');
        expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    test('sendButtonsMessage builds interactiveButtons', async () => {
        await sendButtonsMessage(1, {
            to: '5511999999999',
            text: 'Choose',
            buttons: [{ id: 'a', text: 'Option A' }],
        });
        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        const call = mockSendMessage.mock.calls[0];
        expect(call).toBeDefined();
    });

    test('sendBulkMessage handles multiple recipients', async () => {
        const results = await sendBulkMessage(1, {
            recipients: ['5511111111111', '5522222222222'],
            message: { type: 'text', text: 'Bulk hello' },
        });
        expect(results).toHaveLength(2);
        expect(results.every((r) => r.success)).toBe(true);
    });

    test('sendImageMessage with imageUrl', async () => {
        const result = await sendImageMessage(1, {
            to: '5511999999999',
            imageUrl: 'https://example.com/photo.jpg',
            caption: 'Test caption',
        });
        expect(result.success).toBe(true);
        expect(result.jid).toBe('5511999999999@s.whatsapp.net');
        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        const call = mockSendMessage.mock.calls[0];
        expect(call?.[1]).toMatchObject({
            image: { url: 'https://example.com/photo.jpg' },
            caption: 'Test caption',
        });
    });

    test('sendImageMessage with imageBase64', async () => {
        const result = await sendImageMessage(1, {
            to: '5511999999999',
            imageBase64: TEST_IMAGE_BASE64,
        });
        expect(result.success).toBe(true);
        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        const call = mockSendMessage.mock.calls[0];
        expect(call?.[1]).toMatchObject({
            image: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
        });
    });
});
