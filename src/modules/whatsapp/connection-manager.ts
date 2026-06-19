import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
  type WAMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { useDatabaseAuthState } from './auth-state.ts';
import {
  updateSessionStatus,
  clearSessionAuth,
  saveReceivedMessage,
  getSession,
} from './session-repository.ts';
import type { ConnectionInfo, ConnectionStatus } from './types.ts';

interface TenantConnection {
  socket: WASocket | null;
  status: ConnectionStatus;
  qrCode: string | null;
  phoneNumber: string | null;
  connecting: boolean;
}

class WhatsAppConnectionManager {
  private connections = new Map<number, TenantConnection>();

  private getOrCreate(tenantId: number): TenantConnection {
    let conn = this.connections.get(tenantId);
    if (!conn) {
      conn = {
        socket: null,
        status: 'disconnected',
        qrCode: null,
        phoneNumber: null,
        connecting: false,
      };
      this.connections.set(tenantId, conn);
    }
    return conn;
  }

  async connect(tenantId: number): Promise<ConnectionInfo> {
    const conn = this.getOrCreate(tenantId);

    if (conn.socket && conn.status === 'connected') {
      return this.getConnectionInfo(tenantId);
    }

    if (conn.connecting) {
      return this.getConnectionInfo(tenantId);
    }

    conn.connecting = true;
    await updateSessionStatus(tenantId, 'connecting');

    try {
      if (conn.socket) {
        conn.socket.end(undefined);
        conn.socket = null;
      }

      const { state, saveCreds } = await useDatabaseAuthState(tenantId);
      const { version } = await fetchLatestBaileysVersion();

      const socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: false,
      });

      conn.socket = socket;
      conn.status = 'connecting';

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          conn.qrCode = qr;
          conn.status = 'qr_pending';
          await updateSessionStatus(tenantId, 'qr_pending', { qr_code: qr });
        }

        if (connection === 'open') {
          conn.status = 'connected';
          conn.qrCode = null;
          const userJid = socket.user?.id ?? null;
          conn.phoneNumber = userJid ? userJid.split(':')[0] ?? userJid : null;
          await updateSessionStatus(tenantId, 'connected', {
            phone_number: conn.phoneNumber,
            qr_code: null,
          });
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
          const loggedOut = statusCode === DisconnectReason.loggedOut;

          conn.status = loggedOut ? 'logged_out' : 'disconnected';
          conn.socket = null;
          conn.connecting = false;

          if (loggedOut) {
            await clearSessionAuth(tenantId);
            await updateSessionStatus(tenantId, 'logged_out', { qr_code: null });
          } else {
            await updateSessionStatus(tenantId, 'disconnected', { qr_code: null });
          }

          if (!loggedOut && statusCode !== DisconnectReason.loggedOut) {
            setTimeout(() => {
              this.connect(tenantId).catch(() => undefined);
            }, 3000);
          }
        }
      });

      socket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
          await this.handleIncomingMessage(tenantId, msg);
        }
      });

      conn.connecting = false;
      return this.getConnectionInfo(tenantId);
    } catch (error) {
      conn.connecting = false;
      conn.status = 'disconnected';
      await updateSessionStatus(tenantId, 'disconnected');
      throw error;
    }
  }

  async disconnect(tenantId: number): Promise<ConnectionInfo> {
    const conn = this.getOrCreate(tenantId);

    if (conn.socket) {
      conn.socket.end(undefined);
      conn.socket = null;
    }

    conn.status = 'disconnected';
    conn.qrCode = null;
    conn.phoneNumber = null;
    conn.connecting = false;

    await updateSessionStatus(tenantId, 'disconnected', { qr_code: null });
    return this.getConnectionInfo(tenantId);
  }

  async logout(tenantId: number): Promise<ConnectionInfo> {
    const conn = this.getOrCreate(tenantId);

    if (conn.socket) {
      await conn.socket.logout();
      conn.socket = null;
    }

    await clearSessionAuth(tenantId);
    conn.status = 'logged_out';
    conn.qrCode = null;
    conn.phoneNumber = null;

    return this.getConnectionInfo(tenantId);
  }

  getSocket(tenantId: number): WASocket | null {
    return this.getOrCreate(tenantId).socket;
  }

  async getConnectionInfo(tenantId: number): Promise<ConnectionInfo> {
    const conn = this.getOrCreate(tenantId);
    const dbSession = await getSession(tenantId);

    const status = conn.status !== 'disconnected' || !dbSession
      ? conn.status
      : (dbSession.status as ConnectionStatus);

    return {
      status,
      phoneNumber: conn.phoneNumber ?? dbSession?.phone_number ?? null,
      qrCode: conn.qrCode ?? dbSession?.qr_code ?? null,
      isConnected: status === 'connected' && conn.socket !== null,
      lastConnectedAt: dbSession?.last_connected_at
        ? new Date(dbSession.last_connected_at).toISOString()
        : null,
    };
  }

  private async handleIncomingMessage(tenantId: number, msg: WAMessage): Promise<void> {
    if (msg.key.fromMe) return;

    const remoteJid = msg.key.remoteJid;
    const messageId = msg.key.id;
    if (!remoteJid || !messageId) return;

    const content =
      msg.message?.conversation ??
      msg.message?.extendedTextMessage?.text ??
      msg.message?.imageMessage?.caption ??
      null;

    const messageType = Object.keys(msg.message ?? {})[0] ?? 'unknown';

    await saveReceivedMessage(tenantId, remoteJid, messageId, messageType, content);
  }

  /** Expõe conexões ativas — útil para testes */
  hasActiveConnection(tenantId: number): boolean {
    const conn = this.connections.get(tenantId);
    return !!conn?.socket && conn.status === 'connected';
  }
}

export const whatsappManager = new WhatsAppConnectionManager();
