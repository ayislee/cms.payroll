const fs = require('node:fs');
const path = require('node:path');

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
        return env;
      }

      const [key, ...valueParts] = trimmed.split('=');
      let value = valueParts.join('=').trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key.trim()] = value;
      return env;
    }, {});
};

const env = {
  ...loadEnvFile(path.resolve(__dirname, '.env')),
  ...process.env,
};

const appName = env.VITE_APP_NAME || 'react-build';
const appPort = Number(env.VITE_APP_PORT || 3000);

if (!Number.isInteger(appPort) || appPort <= 0) {
  throw new Error('VITE_APP_PORT must be a positive integer');
}

module.exports = {
  apps: [
    {
      name: appName,
      script: 'serve',
      cwd: __dirname,
      env: {
        ...env,
        PM2_SERVE_PATH: './build',
        PM2_SERVE_PORT: String(appPort),
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: './build/index.html',
      },
    },
  ],
};
