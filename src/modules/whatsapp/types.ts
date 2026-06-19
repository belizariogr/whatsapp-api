export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'qr_pending'
  | 'connected'
  | 'logged_out';

export interface ConnectionInfo {
  status: ConnectionStatus;
  phoneNumber: string | null;
  qrCode: string | null;
  isConnected: boolean;
  lastConnectedAt: string | null;
}

export class WhatsAppApiError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = 'WhatsAppApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class WhatsAppNotLoggedInError extends WhatsAppApiError {
  constructor(message = 'WhatsApp not logged in. Call POST /whatsapp/login first.') {
    super('NOT_LOGGED_IN', message, 401);
    this.name = 'WhatsAppNotLoggedInError';
  }
}

export class WhatsAppNotConnectedError extends WhatsAppApiError {
  constructor(message: string) {
    super('NOT_CONNECTED', message, 503);
    this.name = 'WhatsAppNotConnectedError';
  }
}

export class TenantAlreadyLoggedInError extends WhatsAppApiError {
  constructor() {
    super('ALREADY_LOGGED_IN', 'Tenant is already logged in to WhatsApp.', 409);
    this.name = 'TenantAlreadyLoggedInError';
  }
}

export function isWhatsAppApiError(error: unknown): error is WhatsAppApiError {
  return error instanceof WhatsAppApiError;
}

export interface SendTextPayload {
  to: string;
  text: string;
}

export interface SendLinkPayload {
  to: string;
  text: string;
}

export interface SendImagePayload {
  to: string;
  imageUrl?: string;
  imageBase64?: string;
  caption?: string;
}

export interface QuickReplyButton {
  id: string;
  text: string;
}

export interface SendButtonsPayload {
  to: string;
  text: string;
  footer?: string;
  buttons: QuickReplyButton[];
}

export interface SendLinkButtonPayload {
  to: string;
  text: string;
  footer?: string;
  buttonText: string;
  url: string;
}

export interface SendBulkPayload {
  recipients: string[];
  message: {
    type: 'text' | 'link' | 'image' | 'buttons' | 'link_button';
    text?: string;
    imageUrl?: string;
    imageBase64?: string;
    caption?: string;
    footer?: string;
    buttons?: QuickReplyButton[];
    buttonText?: string;
    url?: string;
  };
}

export interface SendResult {
  to: string;
  jid: string;
  messageId: string | undefined;
  success: boolean;
  error?: string;
}

export interface ReceivedMessageInfo {
  remoteJid: string;
  messageId: string;
  messageType: string;
  content: string | null;
  receivedAt: string;
}
