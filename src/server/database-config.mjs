/** @param {NodeJS.ProcessEnv} [env] */
export function databaseConfig(env = process.env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL_REQUIRED');
  return {
    connectionString: env.DATABASE_URL,
    // Ne jamais désactiver la validation du certificat. Le réseau privé Railway
    // peut être sans TLS ; une connexion publique doit activer CONTACT_DB_SSL.
    ssl: env.CONTACT_DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 8000,
    application_name: 'portfolio-contact',
  };
}
