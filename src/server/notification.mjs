/**
 * Notification interne uniquement. La demande est déjà enregistrée.
 * Une réservation évite les envois concurrents ; Resend reçoit une clé stable.
 * @param {import('pg').Pool | import('pg').PoolClient} db
 * @param {string} id
 * @param {{ env?: NodeJS.ProcessEnv; fetcher?: typeof fetch }} [options]
 * @returns {Promise<'sent' | 'pending' | 'failed' | 'sending'>}
 */
export async function notifyLead(db, id, { env = process.env, fetcher = fetch } = {}) {
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL || !env.CONTACT_TO_EMAIL) return 'pending';
  const claim = await db.query(
    `
    UPDATE contact_leads
    SET notification_status = 'sending', notification_attempts = notification_attempts + 1,
        notification_attempted_at = now()
    WHERE id = $1 AND (notification_status IN ('pending', 'failed')
      OR (notification_status = 'sending' AND notification_attempted_at < now() - interval '5 minutes'))
    RETURNING id, name, email, company, phone, need, budget, deadline, message
  `,
    [id],
  );
  const lead = claim.rows[0];
  if (!lead) {
    const current = await db.query('SELECT notification_status FROM contact_leads WHERE id = $1', [
      id,
    ]);
    return current.rows[0]?.notification_status || 'pending';
  }
  try {
    const response = await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `contact/${id}`,
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: lead.email,
        subject: 'Nouvelle demande depuis le portfolio',
        text: [
          `Référence : ${id}`,
          `Nom : ${lead.name}`,
          `Email : ${lead.email}`,
          `Entreprise : ${lead.company || '—'}`,
          `Téléphone : ${lead.phone || '—'}`,
          `Besoin : ${lead.need}`,
          `Budget : ${lead.budget}`,
          `Échéance : ${lead.deadline}`,
          '',
          lead.message,
        ].join('\n'),
      }),
    });
    if (!response.ok) throw new Error('PROVIDER_REJECTED');
    const payload = await response.json();
    if (!payload || typeof payload.id !== 'string') throw new Error('PROVIDER_INVALID_RESPONSE');
    await db.query(
      `UPDATE contact_leads SET notification_status = 'sent', notification_sent_at = now(), notification_error = NULL WHERE id = $1`,
      [id],
    );
    return 'sent';
  } catch {
    await db.query(
      `UPDATE contact_leads SET notification_status = 'failed', notification_error = 'provider_unavailable' WHERE id = $1`,
      [id],
    );
    return 'failed';
  }
}
