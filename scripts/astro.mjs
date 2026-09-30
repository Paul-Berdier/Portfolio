import { spawn } from 'node:child_process';
const child = spawn(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
  },
);
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
child.on('error', () => {
  console.error('Impossible de démarrer Astro. Exécutez npm ci avec Node 24.');
  process.exitCode = 1;
});
