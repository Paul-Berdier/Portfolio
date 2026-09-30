import { writeFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname, basename, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { databaseConfig } from '../src/server/database-config.mjs';
import { notifyLead } from '../src/server/notification.mjs';
import { toCsv } from '../src/server/csv.mjs';

const args = process.argv.slice(2);
const command = args[0];
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const help = `Gestion PRIVÉE des demandes — PostgreSQL configuré dans .env

npm run leads -- list                         Références et états, 50 dernières demandes
npm run leads -- show --id UUID               Consulter une demande (données personnelles)
npm run leads -- export --out CHEMIN.csv       Export CSV privé, maximum 10 000 lignes
npm run leads -- retry                        Retenter 20 notifications en attente/échec
npm run leads -- retry --id UUID              Retenter une demande précise
npm run leads -- retry --id UUID --allow-older Autoriser une ancienne tentative ambiguë
npm run leads -- purge                       Simuler suppression selon conservation configurée
npm run leads -- purge --execute             Exécuter suppression définitive

Aucune commande ne publie une API de consultation. Exportez dans un dossier privé
hors dépôt. Ne partagez pas les sorties show/export. Les notifications réessayées
partent uniquement vers CONTACT_TO_EMAIL configuré. Une clé Resend est réutilisée.
Après 23 h, les anciens échecs demandent --id et --allow-older : vérifiez d’abord
chez Resend si le mail a déjà été accepté (idempotence fournisseur limitée à 24 h).
`;

if (!command || command === '--help' || command === 'help') {
  console.log(help);
  process.exit(0);
}
if (!['list', 'show', 'export', 'retry', 'purge'].includes(command)) {
  console.error(help);
  process.exit(1);
}
const id = option('--id');
if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
  console.error('Référence UUID non valide.');
  process.exit(1);
}
const months = Number(process.env.CONTACT_RETENTION_MONTHS || 12);
if (!Number.isInteger(months) || months < 1 || months > 36) {
  console.error('CONTACT_RETENTION_MONTHS doit être entre 1 et 36.');
  process.exit(1);
}

let db;
try {
  db = new pg.Pool(databaseConfig());
  if (command === 'list') {
    const rows = await db.query(
      'SELECT id, created_at, need, notification_status, notification_attempts FROM contact_leads ORDER BY created_at DESC LIMIT 50',
    );
    console.table(rows.rows);
  } else if (command === 'show') {
    if (!id) throw new Error('ID_REQUIRED');
    const row = await db.query('SELECT * FROM contact_leads WHERE id = $1', [id]);
    console.log(JSON.stringify(row.rows[0] || null, null, 2));
  } else if (command === 'export') {
    const output = option('--out');
    if (!output) throw new Error('PRIVATE_OUTPUT_REQUIRED');
    const requested = resolve(output);
    const destination = join(await realpath(dirname(requested)), basename(requested));
    const projectRoot = await realpath(fileURLToPath(new URL('../', import.meta.url)));
    const inside = relative(projectRoot, destination);
    if (inside !== '..' && !inside.startsWith(`..${sep}`) && !isAbsolute(inside))
      throw new Error('EXPORT_MUST_BE_OUTSIDE_PROJECT');
    const count = await db.query('SELECT count(*)::integer AS count FROM contact_leads');
    if (count.rows[0].count > 10000) throw new Error('EXPORT_TOO_LARGE_USE_DATABASE_BACKUP');
    const columns = [
      'id',
      'created_at',
      'name',
      'email',
      'company',
      'phone',
      'need',
      'budget',
      'deadline',
      'message',
      'notification_status',
    ];
    const rows = await db.query(
      'SELECT id, created_at, name, email, company, phone, need, budget, deadline, message, notification_status FROM contact_leads ORDER BY created_at',
    );
    await writeFile(destination, toCsv(rows.rows, columns), { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ event: 'private_export_created', count: rows.rowCount }));
  } else if (command === 'retry') {
    if (
      !process.env.RESEND_API_KEY ||
      !process.env.CONTACT_FROM_EMAIL ||
      !process.env.CONTACT_TO_EMAIL
    )
      throw new Error('EMAIL_CONFIGURATION_REQUIRED');
    const allowOlder = !!id && args.includes('--allow-older');
    const candidates = await db.query(
      `
      SELECT id FROM contact_leads WHERE ($1::uuid IS NULL OR id = $1)
      AND (notification_status IN ('pending','failed') OR (notification_status = 'sending' AND notification_attempted_at < now() - interval '5 minutes'))
      AND (notification_status = 'pending' OR created_at > now() - interval '23 hours' OR $2)
      AND notification_attempts < 8 ORDER BY created_at LIMIT 20
    `,
      [id || null, allowOlder],
    );
    for (const row of candidates.rows) {
      const status = await notifyLead(db, row.id);
      console.log(JSON.stringify({ event: 'notification_retry', id: row.id, status }));
    }
    if (!candidates.rows.length)
      console.log(
        'Aucune notification éligible. Consultez list et les limites expliquées dans --help.',
      );
  } else if (command === 'purge') {
    const result = await db.query(
      'SELECT count(*)::integer AS count FROM contact_leads WHERE created_at < now() - make_interval(months => $1)',
      [months],
    );
    if (!args.includes('--execute')) {
      console.log(
        JSON.stringify({
          event: 'purge_preview',
          retentionMonths: months,
          count: result.rows[0].count,
          instruction: 'Ajouter --execute pour supprimer définitivement.',
        }),
      );
    } else {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const removed = await client.query(
          'DELETE FROM contact_leads WHERE created_at < now() - make_interval(months => $1)',
          [months],
        );
        await client.query('DELETE FROM contact_idempotency WHERE expires_at <= now()');
        await client.query('DELETE FROM contact_rate_limits WHERE expires_at <= now()');
        await client.query('COMMIT');
        console.log(JSON.stringify({ event: 'purge_complete', deleted: removed.rowCount }));
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  }
} catch (error) {
  const known = [
    'ID_REQUIRED',
    'PRIVATE_OUTPUT_REQUIRED',
    'EXPORT_MUST_BE_OUTSIDE_PROJECT',
    'EXPORT_TOO_LARGE_USE_DATABASE_BACKUP',
    'EMAIL_CONFIGURATION_REQUIRED',
    'DATABASE_URL_REQUIRED',
  ];
  console.error(
    JSON.stringify({
      event: 'leads_command_failed',
      reason:
        error instanceof Error && known.includes(error.message)
          ? error.message
          : 'database_or_file_unavailable',
    }),
  );
  process.exitCode = 1;
} finally {
  await db?.end();
}
