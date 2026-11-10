/*
 * NeuroLearn-X — passwords, sessions and login throttling.
 *
 * Passwords: scrypt with a random 16-byte salt per user.
 * Sessions: random 256-bit token in an HttpOnly cookie; only its SHA-256
 * hash is stored, so a leaked database cannot be replayed as sessions.
 */
'use strict';
const crypto = require('node:crypto');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const SESSION_HOURS = 12;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const key = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: +N, r: +r, p: +p });
  return crypto.timingSafeEqual(key, expected);
}

// Verified against when the username does not exist, so response time does
// not reveal which usernames are registered.
const DUMMY_HASH = hashPassword(crypto.randomBytes(12).toString('hex'));

const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const newId = prefix => `${prefix}_${crypto.randomBytes(9).toString('base64url')}`;

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), userId, expires);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  return { token, maxAge: SESSION_HOURS * 3600 };
}

function sessionUser(db, token) {
  if (!token) return null;
  const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).get(sha256(token), Date.now());
  return row || null;
}

function destroySession(db, token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

function destroyUserSessions(db, userId, exceptToken) {
  if (exceptToken) db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, sha256(exceptToken));
  else db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

/*
 * Locks a username+address pair for 5 minutes after 5 failures, and an
 * address for 15 minutes after 30 failures across usernames.
 */
class LoginThrottle {
  constructor() { this.byPair = new Map(); this.byIp = new Map(); }
  _get(map, key, windowMs) {
    const now = Date.now();
    let e = map.get(key);
    if (!e || (e.until && e.until < now) || (!e.until && now - e.first > windowMs)) { e = { count: 0, first: now, until: 0 }; map.set(key, e); }
    return e;
  }
  blocked(ip, username) {
    const now = Date.now();
    const pair = this.byPair.get(`${ip}|${username.toLowerCase()}`), addr = this.byIp.get(ip);
    const until = Math.max(pair && pair.until > now ? pair.until : 0, addr && addr.until > now ? addr.until : 0);
    return until ? Math.ceil((until - now) / 1000) : 0;
  }
  fail(ip, username) {
    const pair = this._get(this.byPair, `${ip}|${username.toLowerCase()}`, 15 * 60e3);
    if (++pair.count >= 5) pair.until = Date.now() + 5 * 60e3;
    const addr = this._get(this.byIp, ip, 15 * 60e3);
    if (++addr.count >= 30) addr.until = Date.now() + 15 * 60e3;
  }
  succeed(ip, username) { this.byPair.delete(`${ip}|${username.toLowerCase()}`); }
}

// Short, unambiguous class join codes (no 0/O, 1/I/L).
function joinCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  return [...bytes].map(b => alphabet[b % alphabet.length]).join('');
}

module.exports = { hashPassword, verifyPassword, DUMMY_HASH, createSession, sessionUser, destroySession, destroyUserSessions, LoginThrottle, newId, joinCode, SESSION_HOURS };
