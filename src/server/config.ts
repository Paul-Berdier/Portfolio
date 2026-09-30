export interface ContactConfig {
  enabled: boolean;
  availability: 'open' | 'preview' | 'unavailable';
  origins: string[];
  hashSecret: string;
  retentionMonths: number;
  trustedProxyHops: number;
}

export function getContactConfig(env: NodeJS.ProcessEnv = process.env): ContactConfig {
  const approved =
    env.PUBLIC_SITE_MODE === 'production' &&
    env.PUBLIC_LEGAL_VALIDATED === 'true' &&
    env.CONTACT_ENABLED === 'true';
  const origins = (env.CONTACT_ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => {
      try {
        const url = new URL(item);
        return (
          url.origin === item &&
          (url.protocol === 'https:' ||
            (url.protocol === 'http:' &&
              ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
        );
      } catch {
        return false;
      }
    });
  const configured =
    !!env.DATABASE_URL && (env.CONTACT_HASH_SECRET?.length ?? 0) >= 32 && origins.length > 0;
  const retention = Number(env.CONTACT_RETENTION_MONTHS || 12);
  const proxyHops = Number(env.CONTACT_TRUSTED_PROXY_HOPS || 0);
  return {
    enabled: approved && configured,
    availability: !approved ? 'preview' : configured ? 'open' : 'unavailable',
    origins,
    hashSecret: env.CONTACT_HASH_SECRET || '',
    retentionMonths:
      Number.isInteger(retention) && retention >= 1 && retention <= 36 ? retention : 12,
    trustedProxyHops:
      Number.isInteger(proxyHops) && proxyHops >= 0 && proxyHops <= 5 ? proxyHops : 0,
  };
}
