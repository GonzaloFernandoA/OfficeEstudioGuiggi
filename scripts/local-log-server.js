#!/usr/bin/env node
// Simple dev-only server to accept POST /log and write incoming JSON payloads to ./tmp/logs
// Run with: npm run local-log

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.LOCAL_LOG_PORT || 4001;

app.use(express.json({ limit: '5mb' }));

const logsDir = path.resolve(__dirname, '..', 'tmp', 'logs');
fs.mkdirSync(logsDir, { recursive: true });

function safeFilename(prefix = 'payload') {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${ts}.json`;
}

app.post('/log', (req, res) => {
  try {
    const payload = req.body;
    const filename = safeFilename('ingreso');
    const filePath = path.join(logsDir, filename);
    fs.writeFileSync(filePath, JSON.stringify({ receivedAt: new Date().toISOString(), payload }, null, 2), 'utf8');
    console.log('Saved log to', filePath);
    res.json({ ok: true, path: filePath });
  } catch (err) {
    console.error('Error writing log:', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(port, () => {
  console.log(`Local log server listening on http://localhost:${port}/log`);
  console.log(`Logs will be written to ${logsDir}`);
});
