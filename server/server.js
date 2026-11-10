/*
 * NeuroLearn-X server entry point.
 *
 *   PORT=3000            port to listen on
 *   HOST=127.0.0.1       use 0.0.0.0 to let classroom devices on the network connect
 *   NLX_DB=data/neurolearnx.db
 *   SECURE_COOKIES=1     set when serving over HTTPS
 *   TEACHER_SIGNUP_CODE  if set, teachers creating their own account must enter it
 */
'use strict';
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { openDb } = require('./db.js');
const { createApp } = require('./app.js');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const DB_FILE = process.env.NLX_DB || path.join(__dirname, '..', 'data', 'neurolearnx.db');

const db = openDb(DB_FILE);
const server = http.createServer(createApp({ db, secureCookies: process.env.SECURE_COOKIES === '1', teacherSignupCode: process.env.TEACHER_SIGNUP_CODE || '' }));

server.listen(PORT, HOST, () => {
  console.log(`NeuroLearn-X running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  if (HOST === '0.0.0.0') {
    Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal)
      .forEach(i => console.log(`  on your network: http://${i.address}:${PORT}`));
  }
  console.log(`Database: ${DB_FILE}`);
});

const shutdown = () => { server.close(() => { db.close(); process.exit(0); }); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
