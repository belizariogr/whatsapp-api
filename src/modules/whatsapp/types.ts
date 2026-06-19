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
