import { getDb } from '../../db/client.ts';

export type SessionStatus =
  | 'disconnected'
  | 'connecting'
  | 'qr_pending'
  | 'connected'
  | 'logged_out';

export interface WhatsAppSessionRecord {
  tenant_id: number;
  status: SessionStatus;
  phone_number: string | null;
  qr_code: string | null;
  last_connected_at: Date | null;
}

export async function ensureTenant(tenantId: number, name?: string): Promise<void> {
  const db = getDb();
  await db`
    INSERT INTO tenants (id, name)
    VALUES (${tenantId}, ${name ?? null})
    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
  `;
}

export async function getSession(tenantId: number): Promise<WhatsAppSessionRecord | null> {
  const db = getDb();
  const rows = await db`
    SELECT tenant_id, status, phone_number, qr_code, last_connected_at
    FROM whatsapp_sessions
    WHERE tenant_id = ${tenantId}
  `;
  if (rows.length === 0) return null;
  const row = rows[0]!;
  return {
    tenant_id: Number(row.tenant_id),
    status: row.status as SessionStatus,
    phone_number: row.phone_number as string | null,
    qr_code: row.qr_code as string | null,
    last_connected_at: row.last_connected_at as Date | null,
  };
}

export async function upsertSession(
  tenantId: number,
  data: Partial<Omit<WhatsAppSessionRecord, 'tenant_id'>>,
): Promise<void> {
  const db = getDb();
  await ensureTenant(tenantId);
  await db`
    INSERT INTO whatsapp_sessions (tenant_id, status, phone_number, qr_code, last_connected_at)
    VALUES (
      ${tenantId},
      ${data.status ?? 'disconnected'},
      ${data.phone_number ?? null},
      ${data.qr_code ?? null},
      ${data.last_connected_at ?? null}
    )
    ON DUPLICATE KEY UPDATE
      status = COALESCE(${data.status ?? null}, status),
      phone_number = COALESCE(${data.phone_number ?? null}, phone_number),
      qr_code = COALESCE(${data.qr_code ?? null}, qr_code),
      last_connected_at = COALESCE(${data.last_connected_at ?? null}, last_connected_at),
      updated_at = CURRENT_TIMESTAMP
  `;
}

export async function updateSessionStatus(
  tenantId: number,
  status: SessionStatus,
  extras?: { phone_number?: string | null; qr_code?: string | null },
): Promise<void> {
  await upsertSession(tenantId, {
    status,
    phone_number: extras?.phone_number,
    qr_code: extras?.qr_code,
    last_connected_at: status === 'connected' ? new Date() : undefined,
  });
}

export async function clearSessionAuth(tenantId: number): Promise<void> {
  const db = getDb();
  await db`DELETE FROM whatsapp_auth_keys WHERE tenant_id = ${tenantId}`;
  await db`DELETE FROM whatsapp_auth_creds WHERE tenant_id = ${tenantId}`;
  await upsertSession(tenantId, {
    status: 'disconnected',
    phone_number: null,
    qr_code: null,
  });
}

export async function saveReceivedMessage(
  tenantId: number,
  remoteJid: string,
  messageId: string,
  messageType: string,
  content: string | null,
): Promise<void> {
  const db = getDb();
  await db`
    INSERT INTO received_messages (tenant_id, remote_jid, message_id, message_type, content)
    VALUES (${tenantId}, ${remoteJid}, ${messageId}, ${messageType}, ${content})
    ON DUPLICATE KEY UPDATE content = VALUES(content)
  `;
}

export async function getLastReceivedMessage(tenantId: number) {
  const db = getDb();
  const rows = await db`
    SELECT remote_jid, message_id, message_type, content, received_at
    FROM received_messages
    WHERE tenant_id = ${tenantId}
    ORDER BY received_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}
