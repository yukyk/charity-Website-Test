require('dotenv').config();
const { validateEnv } = require('./src/config/env');
const { sequelize } = require('./src/config/database');
const app = require('./src/app');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

validateEnv();

const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

function startFrontend() {
  const frontendDir = path.join(__dirname, 'frontend');
  if (!fs.existsSync(path.join(frontendDir, 'package.json'))) {
    console.log('[GiveHope] No frontend/package.json found — skipping frontend dev server.');
    return null;
  }

  const child = spawn('npm', ['run', 'dev'], {
    cwd:   frontendDir,
    shell: true,
    stdio: 'pipe',
  });

  child.stdout.on('data', (data) =>
    process.stdout.write(`\x1b[36m[Frontend]\x1b[0m ${data}`)
  );
  child.stderr.on('data', (data) =>
    process.stderr.write(`\x1b[33m[Frontend]\x1b[0m ${data}`)
  );
  child.on('error', (err) =>
    console.error('[Frontend] Failed to start:', err.message)
  );
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[Frontend] Process exited with code ${code}`);
    }
  });

  return child;
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[GiveHope] Database connected.');

    const server = app.listen(PORT, () => {
      console.log(`\x1b[32m[Backend]\x1b[0m  Running on http://localhost:${PORT} (${process.env.NODE_ENV})`);
      console.log(`\x1b[32m[Backend]\x1b[0m  API docs:  http://localhost:${PORT}/api/v1/docs`);
    });

    let frontend = null;
    if (isDev) {
      frontend = startFrontend();
    }

    // Graceful shutdown — kill frontend child process when backend stops
    const shutdown = () => {
      console.log('\n[GiveHope] Shutting down...');
      if (frontend) frontend.kill();
      server.close(() => process.exit(0));
    };

    process.on('SIGINT',  shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[GiveHope] Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
