// server.js — versão corrigida e revisada
// Base original: arquivo enviado pelo usuário (revisado e modificado).
// Principais melhorias:
// - Suporte POST/GET consistente com frontend (initiate-verification -> POST, generate_key -> POST).
// - Fallback em memória quando Redis não estiver disponível (útil para desenvolvimento).
// - Verificação de membership via /users/@me/guilds (mais confiável para OAuth user token).
// - Marca tokens como usados preservando TTL (tenta usar TTL do Redis; para fallback mantém expiry).
// - Melhores mensagens de erro, logging de stack, validações de entrada.
// - Rotas alias para compatibilidade (/user/keys e /user_keys).
// - Rate-limiter simples por IP em endpoints sensíveis.
// - Correções de concorrência básica ao manipular keys (keysInUse Set).
// - Uso adequado de métodos HTTP (POST para ações que modificam estado).
// - Sanitização mínima e validações.

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const redis = require('redis');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- CONFIG -------------------
const PORT = process.env.PORT || 3000;

const CONFIG = {
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  DOWNLOAD_SECRET: process.env.DOWNLOAD_SECRET || 'change-me-download-secret',
  DOWNLOAD_URL: process.env.DOWNLOAD_URL || 'https://github.com/MRLuke956/ModMenuCrew/releases/download/Mod/BepInEx-Unity.IL2CPP-win-x86-6.0.0-be.674+82077ec.zip',
  DOWNLOAD_EXPIRY_SEC: Number(process.env.DOWNLOAD_EXPIRY_SEC) || 10 * 60,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI,
  DISCORD_REQUIRED_GUILD_ID: process.env.DISCORD_REQUIRED_GUILD_ID,
  DISCORD_INVITE_URL: process.env.DISCORD_INVITE_URL || 'https://discord.gg/PwKxjszxaa',
  MAX_KEYS_PER_DAY: Number(process.env.MAX_KEYS_PER_DAY) || 5,
  VERIFICATION_TOKEN_LIFESPAN_SEC: Number(process.env.VERIFICATION_TOKEN_LIFESPAN_SEC) || 5 * 60,
  SESSION_DURATION_SEC: Number(process.env.SESSION_DURATION_SEC) || 24 * 60 * 60,
  AUTH_STATE_LIFESPAN_SEC: Number(process.env.AUTH_STATE_LIFESPAN_SEC) || 10 * 60,
  RATE_LIMIT_WINDOW_MS: 10 * 1000, // simple window for some endpoints
  RATE_LIMIT_MAX: 10 // max requests per window (per IP) for light endpoints
};

// warn if obviously missing critical envs
if (!CONFIG.DISCORD_CLIENT_ID || !CONFIG.DISCORD_CLIENT_SECRET || !CONFIG.DISCORD_REDIRECT_URI || !CONFIG.DISCORD_REQUIRED_GUILD_ID) {
  console.warn('⚠️ Atenção: variáveis de ambiente do Discord (CLIENT_ID/CLIENT_SECRET/REDIRECT_URI/REQUIRED_GUILD_ID) não estão todas definidas. OAuth pode falhar em produção.');
}

// ------------------- CONNECT DB -------------------
async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ ERRO CRÍTICO: MONGODB_URI não definida. Persistência via MongoDB está desativada.');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { keepAlive: true });
    console.log('✅ Conectado ao MongoDB');
  } catch (err) {
    console.error('❌ Falha ao conectar MongoDB:', err.stack || err);
    process.exit(1);
  }
}

// ------------------- REDIS (ou fallback em memória) -------------------
let redisClient = null;
const memoryStore = new Map(); // fallback simples { key => { value, expiresAt } }

async function connectRedis() {
  if (process.env.REDIS_URL) {
    try {
      redisClient = redis.createClient({ url: process.env.REDIS_URL });
      redisClient.on('error', (e) => console.error('Redis error:', e));
      await redisClient.connect();
      console.log('✅ Conectado ao Redis');
    } catch (err) {
      console.warn('⚠️ Falha ao conectar no Redis — entrando em modo fallback em memória. Erro:', err.message);
      redisClient = null;
    }
  } else {
    console.warn('⚠️ REDIS_URL não definida — usando fallback em memória (não persistente).');
    redisClient = null;
  }
}

// Abstração simples para get/set/del com fallback em memória
async function storeSet(key, valueObj, options = {}) {
  const str = JSON.stringify(valueObj);
  if (redisClient) {
    if (options.EX) {
      await redisClient.set(key, str, { EX: options.EX });
    } else {
      await redisClient.set(key, str);
    }
  } else {
    const expiresAt = options.EX ? Date.now() + options.EX * 1000 : null;
    memoryStore.set(key, { value: str, expiresAt });
  }
}
async function storeGet(key) {
  if (redisClient) {
    const v = await redisClient.get(key);
    return v;
  } else {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }
}
async function storeDel(key) {
  if (redisClient) {
    await redisClient.del(key);
  } else {
    memoryStore.delete(key);
  }
}
async function storeTTL(key) {
  if (redisClient) {
    try {
      const ttl = await redisClient.ttl(key);
      return ttl;
    } catch {
      return -2;
    }
  } else {
    const entry = memoryStore.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    const remainingMs = entry.expiresAt - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : -2;
  }
}

// ------------------- MONGO MODELS -------------------
const dataSchema = new mongoose.Schema({
  _id: { type: String, default: 'main' },
  available_keys: { type: [String], default: [] },
  used_keys: { type: [String], default: [] },
  admin_keys: { type: [String], default: [] },
  users: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { minimize: false });

const Data = mongoose.model('Data', dataSchema);

const usageSchema = new mongoose.Schema({
  _id: String,
  data: mongoose.Schema.Types.Mixed
}, { minimize: false });

const Usage = mongoose.model('Usage', usageSchema);

// ------------------- DATA HELPERS -------------------
async function loadData() {
  const doc = await Data.findById('main').lean();
  if (!doc) {
    const base = { _id: 'main', available_keys: [], used_keys: [], admin_keys: [], users: {} };
    await Data.create(base);
    return base;
  }
  return doc;
}
async function saveData(data) {
  await Data.findByIdAndUpdate('main', data, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function loadUsage() {
  const docs = await Usage.find({}).lean();
  const obj = {};
  docs.forEach(d => obj[d._id] = d.data || {});
  return obj;
}
async function saveUsage(usage) {
  const keys = Object.keys(usage);
  for (const k of keys) {
    await Usage.findByIdAndUpdate(k, { data: usage[k] }, { upsert: true, setDefaultsOnInsert: true });
  }
}

// ------------------- UTILITÁRIOS -------------------
const keysInUse = new Set();

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}
function getClientIP(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'unknown').split(',')[0].trim();
}
function generateNewUniqueKey(data) {
  const existing = new Set([...(data.available_keys || []), ...(data.used_keys || []), ...(data.admin_keys || [])]);
  for (let i = 0; i < 500; i++) {
    const newKey = crypto.randomBytes(8).toString('hex').toUpperCase().match(/.{1,4}/g).join('-');
    if (!existing.has(newKey)) return newKey;
  }
  throw new Error('Não foi possível gerar uma nova chave única após várias tentativas.');
}

// Simple in-memory rate limiter for endpoints (per IP)
const ipRateMap = new Map();
function isRateLimited(ip, key = 'global', limit = CONFIG.RATE_LIMIT_MAX, windowMs = CONFIG.RATE_LIMIT_WINDOW_MS) {
  const mapKey = `${ip}:${key}`;
  const now = Date.now();
  let entry = ipRateMap.get(mapKey);
  if (!entry || now - entry.windowStart >= windowMs) {
    entry = { count: 1, windowStart: now };
    ipRateMap.set(mapKey, entry);
    return false;
  }
  entry.count++;
  if (entry.count > limit) return true;
  return false;
}

// ------------------- MIDDLEWARES -------------------
async function requireAuth(req, res, next) {
  try {
    if (!redisClient && memoryStore.size === 0) {
      return res.status(503).json({ status: 'error', message: 'Serviço de sessão indisponível' });
    }
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) return res.status(401).json({ status: 'error', message: 'Autenticação necessária (X-Session-ID ausente).' });
    const sessionJSON = await storeGet(`session:${sessionId}`);
    if (!sessionJSON) return res.status(401).json({ status: 'error', message: 'Sessão inválida ou expirada.' });
    req.user = JSON.parse(sessionJSON);
    return next();
  } catch (err) {
    console.error('requireAuth error:', err.stack || err);
    return res.status(500).json({ status: 'error', message: 'Erro ao validar sessão.' });
  }
}

function requireGuildMembership(req, res, next) {
  if (!req.user || !req.user.isServerMember) {
    return res.status(403).json({ status: 'error', message: 'Você precisa ser membro do servidor Discord!', discord_invite: CONFIG.DISCORD_INVITE_URL });
  }
  return next();
}

// ------------------- DISCORD OAUTH FLOW -------------------
async function handleDiscordCallback(code, state, clientIP) {
  if (!code || !state) throw new Error('Missing code or state');
  const stateJSON = await storeGet(`state:${state}`);
  if (!stateJSON) throw new Error('Estado de autenticação inválido ou expirado');
  await storeDel(`state:${state}`);
  const st = JSON.parse(stateJSON);
  if (st.ip && st.ip !== clientIP) throw new Error('Mismatch de IP no estado OAuth');

  const params = new URLSearchParams({
    client_id: CONFIG.DISCORD_CLIENT_ID,
    client_secret: CONFIG.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: CONFIG.DISCORD_REDIRECT_URI
  });

  const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000
  });

  const { access_token, token_type } = tokenRes.data;
  if (!access_token) throw new Error('Falha ao obter access token do Discord');

  const authHeader = { Authorization: `${token_type} ${access_token}` };
  const meRes = await axios.get('https://discord.com/api/users/@me', { headers: authHeader, timeout: 8000 });
  const userData = meRes.data;

  let isServerMember = false;
  try {
    const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', { headers: authHeader, timeout: 8000 });
    if (Array.isArray(guildsRes.data)) {
      isServerMember = guildsRes.data.some(g => String(g.id) === String(CONFIG.DISCORD_REQUIRED_GUILD_ID));
    }
  } catch (e) {
    console.warn('Aviso: não foi possível verificar guilds via Discord API:', e.message);
  }

  if (!isServerMember) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      userId: userData.id,
      username: userData.username,
      global_name: userData.global_name,
      avatar: userData.avatar,
      ip: clientIP,
      isServerMember: false,
      joinedAt: null
    };
    await storeSet(`session:${sessionId}`, sessionData, { EX: CONFIG.SESSION_DURATION_SEC });
    return { sessionId, user: sessionData, isServerMember: false };
  }

  const sessionId = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    userId: userData.id,
    username: userData.username,
    global_name: userData.global_name,
    avatar: userData.avatar,
    ip: clientIP,
    isServerMember: true,
    joinedAt: null
  };
  await storeSet(`session:${sessionId}`, sessionData, { EX: CONFIG.SESSION_DURATION_SEC });
  return { sessionId, user: sessionData, isServerMember: true };
}

// ------------------- ROUTAS -------------------
app.get('/', (req, res) => res.json({ status: 'ok', message: 'MIRA HQ Key System Online' }));

app.get('/auth/discord', async (req, res) => {
  try {
    const ip = getClientIP(req);
    const state = crypto.randomBytes(32).toString('hex');
    await storeSet(`state:${state}`, { ip }, { EX: CONFIG.AUTH_STATE_LIFESPAN_SEC });
    const scopes = encodeURIComponent('identify guilds');
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${CONFIG.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.DISCORD_REDIRECT_URI)}&response_type=code&state=${state}&scope=${scopes}&prompt=consent`;
    return res.json({ status: 'success', auth_url: authUrl });
  } catch (err) {
    console.error('/auth/discord error:', err.stack || err);
    return res.status(500).json({ status: 'error', message: 'Erro ao iniciar OAuth' });
  }
});

app.post('/auth/discord/callback', async (req, res) => {
  const { code, state } = req.body || {};
  const ip = getClientIP(req);
  try {
    const result = await handleDiscordCallback(code, state, ip);
    if (!result.isServerMember) {
      return res.status(403).json({ status: 'server_required', message: '🎮 Entre no nosso servidor Discord!', discord_invite: CONFIG.DISCORD_INVITE_URL, session_id: result.sessionId, user: result.user });
    }
    return res.json({ status: 'success', message: `👋 Bem-vindo, ${result.user.username}!`, session_id: result.sessionId, user: result.user });
  } catch (err) {
    const msg = (err && err.message) ? err.message : 'Erro na autenticação';
    console.error('/auth/discord/callback error:', err.stack || err);
    if (msg.includes('Estado') || msg.includes('state')) {
      return res.status(400).json({ status: 'error', message: 'Estado inválido/expirado' });
    }
    return res.status(400).json({ status: 'error', message: 'Falha na autenticação', detail: msg });
  }
});

app.post('/auth/logout', async (req, res) => {
  try {
    const sid = req.body && req.body.session_id;
    if (sid) await storeDel(`session:${sid}`);
    return res.json({ status: 'success', message: '👋 Logout realizado com sucesso' });
  } catch (err) {
    console.error('/auth/logout error:', err.stack || err);
    return res.status(500).json({ status: 'error', message: 'Erro no logout' });
  }
});

app.get('/auth/me', requireAuth, (req, res) => {
  return res.json({ status: 'success', user: req.user });
});

app.get('/auth/user-stats', requireAuth, async (req, res) => {
  try {
    const usage = await loadUsage();
    const ip = req.user.ip;
    const uid = req.user.userId;
    const today = todayDate();
    const usageById = usage[uid] || { date: today, generated: [], used: [] };
    const usageByIp = usage[ip] || { date: today, generated: [], used: [] };
    const keysToday = usageById.date === today ? usageById.generated.length : 0;
    const stats = {
      keys_today: keysToday,
      keys_total: (usageByIp.generated || []).length,
      keys_used: (usageByIp.used || []).length,
      keys_active: (usageByIp.generated || []).length - (usageByIp.used || []).length,
      member_since: req.user.joinedAt,
      is_server_member: !!req.user.isServerMember
    };
    return res.json({ status: 'success', stats });
  } catch (err) {
    console.error('/auth/user-stats error:', err.stack || err);
    return res.status(500).json({ status: 'error', message: 'Erro ao obter estatísticas' });
  }
});

app.post('/initiate-verification', async (req, res) => {
  try {
    const ip = getClientIP(req);
    if (isRateLimited(ip, 'initiate', CONFIG.RATE_LIMIT_MAX, CONFIG.RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ status: 'error', message: 'Muitas solicitações — tente novamente mais tarde.' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    await storeSet(`vtoken:${token}`, { ip, used: false }, { EX: CONFIG.VERIFICATION_TOKEN_LIFESPAN_SEC });
    return res.json({ status: 'success', verification_token: token });
  } catch (err) {
    console.error('/initiate-verification error:', err.stack || err);
    return res.status(500).json({ status: 'error', message: 'Erro ao iniciar verificação' });
  }
});

app.post('/generate_key', requireAuth, requireGuildMembership, async (req, res) => {
  const ip = getClientIP(req);
  const userId = req.user.userId;
  try {
    if (isRateLimited(ip, 'generate', Math.max(2, Math.floor(CONFIG.RATE_LIMIT_MAX / 2)), CONFIG.RATE_LIMIT_WINDOW_MS)) {
      return res.status(429).json({ status: 'error', message: 'Muitas requisições. Aguarde um momento.' });
    }

    let clientVToken = null;
    if (req.headers['x-verification-token']) clientVToken = req.headers['x-verification-token'];
    if (!clientVToken && req.body && req.body.verification_token) clientVToken = req.body.verification_token;
    if (!clientVToken && req.query && req.query.verification_token) clientVToken = req.query.verification_token;
    if (!clientVToken) return res.status(400).json({ status: 'error', message: 'Token de verificação ausente.' });

    const tokenKey = `vtoken:${clientVToken}`;
    const tokenJSON = await storeGet(tokenKey);
    if (!tokenJSON) return res.status(400).json({ status: 'error', message: 'Token inválido ou expirado.' });
    const tokenData = JSON.parse(tokenJSON);
    if (tokenData.used) return res.status(400).json({ status: 'error', message: 'Token já utilizado.' });
    if (tokenData.ip && tokenData.ip !== ip) return res.status(400).json({ status: 'error', message: 'Falha na verificação de IP.' });

    const ttl = await storeTTL(tokenKey);
    const remaining = ttl > 0 ? ttl : undefined;
    await storeSet(tokenKey, { ...tokenData, used: true }, remaining ? { EX: remaining } : {});

    const data = await loadData();
    const usage = await loadUsage();

    const today = todayDate();
    const userDiscordUsage = usage[userId] || { date: today, generated: [], used: [] };
    if (userDiscordUsage.date !== today) {
      userDiscordUsage.date = today;
      userDiscordUsage.generated = [];
      userDiscordUsage.used = [];
    }

    if ((userDiscordUsage.generated || []).length >= CONFIG.MAX_KEYS_PER_DAY) {
      return res.status(429).json({ status: 'error', message: `Limite diário de ${CONFIG.MAX_KEYS_PER_DAY} chaves atingido.` });
    }

    const newKey = generateNewUniqueKey(data);
    data.available_keys = data.available_keys || [];
    data.available_keys.push(newKey);

    const userIPUsage = usage[ip] || { date: today, generated: [], used: [] };
    if (userIPUsage.date !== today) {
      userIPUsage.date = today;
      userIPUsage.generated = [];
      userIPUsage.used = [];
    }

    userIPUsage.generated.push(newKey);
    userDiscordUsage.generated.push(newKey);

    usage[ip] = userIPUsage;
    usage[userId] = userDiscordUsage;

    await saveData(data);
    await saveUsage(usage);

    console.log(`Key gerada por ${req.user.username} (${userId}) [ip:${ip}]: ${newKey}`);
    return res.json({ status: 'success', key: newKey, keys_remaining: CONFIG.MAX_KEYS_PER_DAY - userDiscordUsage.generated.length });
  } catch (err) {
    console.error('/generate_key error:', err.stack || err);
    return res.status(500).json({ status: 'error', message: 'Erro ao gerar chave', detail: err.message });
  }
});

app.get(['/user_keys', '/user/keys'], requireAuth, async (req, res) => {
  try {
    const usage = await loadUsage();
    const ip = req.user.ip;
    const userIPUsage = usage[ip] || { generated: [], used: [] };
    const activeKeys = (userIPUsage.generated || []).filter(k => !((userIPUsage.used || []).includes(k)));
    return res.json({ status: 'success', keys: activeKeys });
  } catch (err) {
    console.error('/user_keys error:', err.stack || err);
    return res.status(500).json({ status: 'error', message: 'Erro ao listar chaves' });
  }
});

app.get('/validate', async (req, res) => {
  const { key } = req.query || {};
  const ip = getClientIP(req);
  if (!key) return res.status(400).json({ status: 'error', message: 'Chave ausente.' });

  if (keysInUse.has(key)) return res.status(409).json({ status: 'error', message: 'Essa chave está sendo validada no momento.' });
  keysInUse.add(key);
  try {
    const data = await loadData();
    const usage = await loadUsage();
    const entry = usage[ip];
    if (!entry || !Array.isArray(entry.generated) || !entry.generated.includes(key)) {
      return res.status(403).json({ status: 'error', message: 'Essa chave não pertence ao seu IP.' });
    }
    if ((entry.used && entry.used.includes(key)) || (data.used_keys || []).includes(key)) {
      return res.json({ status: 'error', message: 'Esta chave já foi utilizada.' });
    }

    const idx = (data.available_keys || []).indexOf(key);
    if (idx > -1) data.available_keys.splice(idx, 1);
    data.used_keys = data.used_keys || [];
    if (!data.used_keys.includes(key)) data.used_keys.push(key);

    entry.used = entry.used || [];
    entry.used.push(key);

    await saveData(data);
    await saveUsage(usage);

    if (redisClient || memoryStore) {
      const downloadToken = crypto.randomBytes(32).toString('hex');
      await storeSet(`dtoken:${downloadToken}`, { key, ip, used: false }, { EX: CONFIG.DOWNLOAD_EXPIRY_SEC });
      return res.json({ status: 'success', message: 'Chave validada com sucesso.', download_token: downloadToken });
    } else {
      return res.json({ status: 'success', message: 'Chave validada com sucesso.' });
    }
  } catch (err) {
    console.error('/validate error:', err.stack || err);
    return res.status(500).json({ status: 'error', message: 'Erro ao validar chave' });
  } finally {
    keysInUse.delete(key);
  }
});

app.get('/get-download-url', async (req, res) => {
  const { token } = req.query || {};
  const ip = getClientIP(req);
  if (!token) return res.status(400).json({ status: 'error', message: 'Token ausente.' });
  try {
    const tokenJSON = await storeGet(`dtoken:${token}`);
    if (!tokenJSON) return res.status(403).json({ status: 'error', message: 'Token inválido ou expirado.' });
    const tokenInfo = JSON.parse(tokenJSON);
    if (tokenInfo.used) return res.status(403).json({ status: 'error', message: 'Token já utilizado.' });
    if (tokenInfo.ip && tokenInfo.ip !== ip) return res.status(403).json({ status: 'error', message: 'IP não corresponde ao token.' });

    const ttl = await storeTTL(`dtoken:${token}`);
    await storeSet(`dtoken:${token}`, { ...tokenInfo, used: true }, ttl > 0 ? { EX: ttl } : {});

    const ts = Date.now();
    const sig = crypto.createHmac('sha256', CONFIG.DOWNLOAD_SECRET).update(`${tokenInfo.key}:${ts}`).digest('hex');
    const url = `${CONFIG.DOWNLOAD_URL}?sig=${sig}&ts=${ts}`;
    return res.json({ status: 'success', download_url: url });
  } catch (err) {
    console.error('/get-download-url error:', err.stack || err);
    return res.status(500).json({ status: 'error', message: 'Erro ao gerar URL de download' });
  }
});

// ------------------- STARTUP -------------------
async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`🚀 MIRA HQ Key System rodando na porta ${PORT}`);
      console.log('=================================');
    });
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err.stack || err);
    process.exit(1);
  }
}

startServer();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err && (err.stack || err));
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && (err.stack || err));
});
