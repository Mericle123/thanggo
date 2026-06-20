const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// JSON (de)serialization helpers — Json columns are stored as String for SQLite portability.
const jstr = (v) => (v == null ? null : JSON.stringify(v));
const jparse = (v, d = null) => { if (v == null) return d; try { return JSON.parse(v); } catch { return d; } };

module.exports = { prisma, jstr, jparse };
