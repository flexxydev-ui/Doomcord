import express from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Ensure persistent local server directory exists for auth credentials & idempotency
const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ACCOUNTS_FILE = path.join(DATA_DIR, 'auth_accounts.json');
const RZP_CONFIG_FILE = path.join(DATA_DIR, 'razorpay_config.json');
const WEBHOOK_EVENTS_FILE = path.join(DATA_DIR, 'webhook_events.json');
const SERVER_SECRET_FILE = path.join(DATA_DIR, 'server_secret.key');

// Persistent HMAC secret for signing session tokens
function getServerSecret(): string {
  if (fs.existsSync(SERVER_SECRET_FILE)) {
    return fs.readFileSync(SERVER_SECRET_FILE, 'utf-8').trim();
  }
  const generated = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(SERVER_SECRET_FILE, generated, { mode: 0o600 });
  return generated;
}

const SERVER_SECRET = getServerSecret();

export interface ServerAuthAccount {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  passwordSalt: string;
  passwordHash: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  mustChangePassword: boolean;
  isBanned: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashPassword(password, salt), 'hex');
  const target = Buffer.from(storedHash, 'hex');
  if (candidate.length !== target.length) return false;
  return crypto.timingSafeEqual(candidate, target);
}

function loadAccounts(): Record<string, ServerAuthAccount> {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Record<string, ServerAuthAccount>): void {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), { mode: 0o600 });
}

// Bootstrap the single initial Owner account (idempotent, never duplicates)
function bootstrapOwnerAccount(): ServerAuthAccount {
  const accounts = loadAccounts();
  const ownerEmail = 'razorpay@admin.doom';

  const existingOwner = Object.values(accounts).find(
    (acc) => acc.email.toLowerCase() === ownerEmail || acc.role === 'owner'
  );

  if (existingOwner) {
    return existingOwner;
  }

  const ownerUid = crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  // Initial temporary password defined by specification; stored strictly as scrypt hash
  const initialTempPassword = process.env.INITIAL_OWNER_PASSWORD || '1234';
  const passwordHash = hashPassword(initialTempPassword, salt);
  const now = new Date().toISOString();

  const ownerAccount: ServerAuthAccount = {
    uid: ownerUid,
    email: ownerEmail,
    username: 'doomcord_owner',
    displayName: 'Doomcord Owner',
    passwordSalt: salt,
    passwordHash,
    role: 'owner',
    mustChangePassword: true,
    isBanned: false,
    isSuspended: false,
    createdAt: now,
    updatedAt: now,
  };

  accounts[ownerUid] = ownerAccount;
  saveAccounts(accounts);
  return ownerAccount;
}

const bootstrappedOwner = bootstrapOwnerAccount();

// Token signing & verification
interface TokenPayload {
  uid: string;
  email: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  iat: number;
}

function signToken(payload: TokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SERVER_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token?: string): TokenPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SERVER_SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as TokenPayload;
  } catch {
    return null;
  }
}

function extractSession(req: express.Request): ServerAuthAccount | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return null;
  const accounts = loadAccounts();
  return accounts[payload.uid] || null;
}

// Razorpay Runtime Config Loader
interface RazorpayServerConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  merchantUpiId: string;
  updatedAt: string;
}

function loadRazorpayConfig(): RazorpayServerConfig {
  let fileCfg: Partial<RazorpayServerConfig> = {};
  if (fs.existsSync(RZP_CONFIG_FILE)) {
    try {
      fileCfg = JSON.parse(fs.readFileSync(RZP_CONFIG_FILE, 'utf-8'));
    } catch {
      fileCfg = {};
    }
  }
  return {
    keyId: process.env.RAZORPAY_KEY_ID || fileCfg.keyId || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || fileCfg.keySecret || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || fileCfg.webhookSecret || '',
    merchantUpiId: fileCfg.merchantUpiId || 'adrenoxshriyans@fam',
    updatedAt: fileCfg.updatedAt || new Date().toISOString(),
  };
}

function saveRazorpayConfig(cfg: RazorpayServerConfig): void {
  fs.writeFileSync(RZP_CONFIG_FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

app.use(express.json({ limit: '5mb' }));

// --- AUTHENTICATION API ---

// Get Owner Public Metadata (UUID & email so Firestore profile stays synchronized)
app.get('/api/auth/owner-info', (_req, res) => {
  const owner = bootstrapOwnerAccount();
  res.json({
    uid: owner.uid,
    email: owner.email,
    username: owner.username,
    displayName: owner.displayName,
    role: owner.role,
    createdAt: owner.createdAt,
  });
});

// Register a new real user account
app.post('/api/auth/register', (req, res) => {
  const { email, password, username, displayName } = req.body || {};
  if (!email || !password || !username || !displayName) {
    res.status(400).json({ error: 'Email, password, username, and display name are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

  if (normalizedEmail === 'razorpay@admin.doom') {
    res.status(403).json({ error: 'This email is reserved for the platform owner.' });
    return;
  }

  if (normalizedUsername.length < 2 || normalizedUsername.length > 32) {
    res.status(400).json({ error: 'Username must be between 2 and 32 characters.' });
    return;
  }

  if (String(password).length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const accounts = loadAccounts();
  const emailTaken = Object.values(accounts).some((a) => a.email.toLowerCase() === normalizedEmail);
  if (emailTaken) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const usernameTaken = Object.values(accounts).some((a) => a.username.toLowerCase() === normalizedUsername);
  if (usernameTaken) {
    res.status(409).json({ error: 'This username is already taken.' });
    return;
  }

  const uid = crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(String(password), salt);
  const now = new Date().toISOString();

  const newAccount: ServerAuthAccount = {
    uid,
    email: normalizedEmail,
    username: normalizedUsername,
    displayName: String(displayName).trim().slice(0, 50),
    passwordSalt: salt,
    passwordHash,
    role: 'member',
    mustChangePassword: false,
    isBanned: false,
    isSuspended: false,
    createdAt: now,
    updatedAt: now,
  };

  accounts[uid] = newAccount;
  saveAccounts(accounts);

  const token = signToken({
    uid: newAccount.uid,
    email: newAccount.email,
    role: newAccount.role,
    iat: Date.now(),
  });

  res.json({
    token,
    user: {
      uid: newAccount.uid,
      email: newAccount.email,
      username: newAccount.username,
      displayName: newAccount.displayName,
      role: newAccount.role,
      mustChangePassword: newAccount.mustChangePassword,
      createdAt: newAccount.createdAt,
    },
  });
});

// Login with email and password
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  bootstrapOwnerAccount();
  const accounts = loadAccounts();
  const normalizedEmail = String(email).trim().toLowerCase();
  const account = Object.values(accounts).find((a) => a.email.toLowerCase() === normalizedEmail);

  if (!account || !verifyPassword(String(password), account.passwordSalt, account.passwordHash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (account.isBanned) {
    res.status(403).json({ error: 'This account has been permanently banned from Doomcord.' });
    return;
  }

  if (account.isSuspended) {
    res.status(403).json({ error: 'This account is currently suspended.' });
    return;
  }

  const token = signToken({
    uid: account.uid,
    email: account.email,
    role: account.role,
    iat: Date.now(),
  });

  res.json({
    token,
    user: {
      uid: account.uid,
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      mustChangePassword: account.mustChangePassword,
      createdAt: account.createdAt,
    },
  });
});

// Verify active session
app.get('/api/auth/session', (req, res) => {
  const account = extractSession(req);
  if (!account) {
    res.status(401).json({ error: 'Unauthenticated session.' });
    return;
  }
  if (account.isBanned || account.isSuspended) {
    res.status(403).json({ error: 'Account access restricted.' });
    return;
  }
  res.json({
    user: {
      uid: account.uid,
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      mustChangePassword: account.mustChangePassword,
      createdAt: account.createdAt,
    },
  });
});

// Change Password (enforced on first login for owner)
app.post('/api/auth/change-password', (req, res) => {
  const account = extractSession(req);
  if (!account) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  if (!verifyPassword(String(currentPassword), account.passwordSalt, account.passwordHash)) {
    res.status(401).json({ error: 'Current password is incorrect.' });
    return;
  }

  if (String(newPassword).length < 6 || String(newPassword) === '1234') {
    res.status(400).json({
      error: 'New password must be at least 6 characters long and cannot be the temporary password (1234).',
    });
    return;
  }

  const accounts = loadAccounts();
  const newSalt = crypto.randomBytes(16).toString('hex');
  account.passwordSalt = newSalt;
  account.passwordHash = hashPassword(String(newPassword), newSalt);
  account.mustChangePassword = false;
  account.updatedAt = new Date().toISOString();

  accounts[account.uid] = account;
  saveAccounts(accounts);

  res.json({
    success: true,
    mustChangePassword: false,
  });
});

// Sync external Firebase OAuth user into server account registry (as member)
app.post('/api/auth/sync-oauth', (req, res) => {
  const { uid, email, username, displayName } = req.body || {};
  if (!uid || !email) {
    res.status(400).json({ error: 'UID and email required.' });
    return;
  }

  const accounts = loadAccounts();
  let acc = accounts[uid];
  const now = new Date().toISOString();

  if (!acc) {
    const salt = crypto.randomBytes(16).toString('hex');
    acc = {
      uid,
      email: String(email).toLowerCase(),
      username: String(username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_.-]/g, ''),
      displayName: String(displayName || 'User'),
      passwordSalt: salt,
      passwordHash: hashPassword(crypto.randomUUID(), salt),
      role: String(email).toLowerCase() === 'razorpay@admin.doom' ? 'owner' : 'member',
      mustChangePassword: false,
      isBanned: false,
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
    };
    accounts[uid] = acc;
    saveAccounts(accounts);
  }

  const token = signToken({
    uid: acc.uid,
    email: acc.email,
    role: acc.role,
    iat: Date.now(),
  });

  res.json({
    token,
    user: {
      uid: acc.uid,
      email: acc.email,
      username: acc.username,
      displayName: acc.displayName,
      role: acc.role,
      mustChangePassword: acc.mustChangePassword,
      createdAt: acc.createdAt,
    },
  });
});

// --- SERVER-SIDE ADMIN & MODERATION ENDPOINTS ---

app.post('/api/admin/user-role', (req, res) => {
  const actor = extractSession(req);
  if (!actor || (actor.role !== 'owner' && actor.role !== 'admin')) {
    res.status(403).json({ error: 'Forbidden: Administrator or Owner role required.' });
    return;
  }

  const { targetUid, newRole } = req.body || {};
  if (!targetUid || !['admin', 'moderator', 'member'].includes(newRole)) {
    res.status(400).json({ error: 'Valid targetUid and role (admin, moderator, member) required.' });
    return;
  }

  const accounts = loadAccounts();
  const target = accounts[targetUid];
  if (target && target.role === 'owner') {
    res.status(403).json({ error: 'Protected: The platform Owner cannot be downgraded or modified.' });
    return;
  }

  if (actor.role !== 'owner' && newRole === 'admin') {
    res.status(403).json({ error: 'Only the platform Owner can promote users to Administrator.' });
    return;
  }

  if (target) {
    target.role = newRole;
    target.updatedAt = new Date().toISOString();
    accounts[targetUid] = target;
    saveAccounts(accounts);
  }

  res.json({ success: true, targetUid, role: newRole });
});

app.post('/api/admin/user-moderation', (req, res) => {
  const actor = extractSession(req);
  if (!actor || (actor.role !== 'owner' && actor.role !== 'admin' && actor.role !== 'moderator')) {
    res.status(403).json({ error: 'Forbidden: Moderation privileges required.' });
    return;
  }

  const { targetUid, action } = req.body || {};
  const accounts = loadAccounts();
  const target = accounts[targetUid];

  if (target && target.role === 'owner') {
    res.status(403).json({ error: 'Protected: The platform Owner cannot be banned or suspended.' });
    return;
  }

  if (target && target.role === 'admin' && actor.role !== 'owner') {
    res.status(403).json({ error: 'Only the Owner can moderate an Administrator.' });
    return;
  }

  if (target) {
    if (action === 'ban') target.isBanned = true;
    if (action === 'unban') target.isBanned = false;
    if (action === 'suspend') target.isSuspended = true;
    if (action === 'unsuspend') target.isSuspended = false;
    target.updatedAt = new Date().toISOString();
    accounts[targetUid] = target;
    saveAccounts(accounts);
  }

  res.json({ success: true, targetUid, action });
});

// --- RAZORPAY PAYMENT GATEWAY & SUBSCRIPTION ENDPOINTS ---

app.get('/api/razorpay/status', (_req, res) => {
  const cfg = loadRazorpayConfig();
  const hasKeys = Boolean(cfg.keyId && cfg.keySecret);
  const hasWebhookSecret = Boolean(cfg.webhookSecret);
  const mode = cfg.keyId.startsWith('rzp_live_')
    ? 'live'
    : cfg.keyId.startsWith('rzp_test_')
    ? 'test'
    : 'unconfigured';

  res.json({
    configured: hasKeys,
    webhookConfigured: hasWebhookSecret,
    mode,
    keyIdPublic: cfg.keyId || null,
    merchantUpiId: cfg.merchantUpiId,
    currency: 'INR',
    supportedMethods: ['UPI (AutoPay & Intent)', 'Credit Cards', 'Debit Cards', 'Net Banking', 'Wallets'],
    missingSteps: !hasKeys
      ? [
          'Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in AI Studio Secrets or Admin Payment Settings.',
          'Configure RAZORPAY_WEBHOOK_SECRET for automated subscription & payment lifecycle webhooks.',
          'Ensure Merchant KYC, bank settlement, and UPI AutoPay mandates are activated in your Razorpay Dashboard.',
        ]
      : [],
  });
});

// Update Razorpay configuration (Owner Only)
app.post('/api/admin/razorpay-config', (req, res) => {
  const actor = extractSession(req);
  if (!actor || actor.role !== 'owner') {
    res.status(403).json({ error: 'Forbidden: Only the platform Owner can modify payment gateway credentials.' });
    return;
  }

  const { keyId, keySecret, webhookSecret, merchantUpiId } = req.body || {};
  const current = loadRazorpayConfig();

  const updated: RazorpayServerConfig = {
    keyId: keyId !== undefined ? String(keyId).trim() : current.keyId,
    keySecret: keySecret !== undefined && keySecret !== '••••••••' ? String(keySecret).trim() : current.keySecret,
    webhookSecret:
      webhookSecret !== undefined && webhookSecret !== '••••••••'
        ? String(webhookSecret).trim()
        : current.webhookSecret,
    merchantUpiId: merchantUpiId ? String(merchantUpiId).trim() : current.merchantUpiId,
    updatedAt: new Date().toISOString(),
  };

  saveRazorpayConfig(updated);
  res.json({
    success: true,
    configured: Boolean(updated.keyId && updated.keySecret),
    webhookConfigured: Boolean(updated.webhookSecret),
    merchantUpiId: updated.merchantUpiId,
  });
});

// Create Razorpay Order (Server-side only)
app.post('/api/razorpay/create-order', async (req, res) => {
  const actor = extractSession(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required to create a payment order.' });
    return;
  }

  const { amountINR, itemType, itemId, itemName } = req.body || {};
  const numericAmount = Number(amountINR);
  if (!numericAmount || numericAmount <= 0) {
    res.status(400).json({ error: 'Valid positive amount in INR is required.' });
    return;
  }

  const cfg = loadRazorpayConfig();
  if (!cfg.keyId || !cfg.keySecret) {
    res.status(503).json({
      error: 'RAZORPAY_CREDENTIALS_MISSING',
      message:
        'Razorpay API credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured yet. Live or test orders cannot be created until real credentials are supplied in Admin Payment Settings or environment secrets.',
      merchantUpiId: cfg.merchantUpiId,
    });
    return;
  }

  try {
    const authToken = Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64');
    const receiptId = `doom_${Date.now()}_${actor.uid.slice(0, 6)}`;

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(numericAmount * 100), // paise
        currency: 'INR',
        receipt: receiptId,
        notes: {
          userId: actor.uid,
          userEmail: actor.email,
          itemType: String(itemType || 'cosmetic_purchase'),
          itemId: String(itemId || ''),
          itemName: String(itemName || ''),
          merchantUpiReference: cfg.merchantUpiId,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({
        error: 'RAZORPAY_ORDER_FAILED',
        message: data?.error?.description || 'Failed to create Razorpay order with the configured credentials.',
      });
      return;
    }

    res.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId: cfg.keyId,
      merchantUpiId: cfg.merchantUpiId,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'RAZORPAY_NETWORK_ERROR',
      message: err?.message || 'Error communicating with Razorpay API.',
    });
  }
});

// Verify Razorpay Checkout Signature on Server
app.post('/api/razorpay/verify-payment', (req, res) => {
  const actor = extractSession(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: 'Missing Razorpay payment verification parameters.' });
    return;
  }

  const cfg = loadRazorpayConfig();
  if (!cfg.keySecret) {
    res.status(503).json({ error: 'Razorpay secret key is not configured on the server.' });
    return;
  }

  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto.createHmac('sha256', cfg.keySecret).update(payload).digest('hex');

  const isValid =
    expectedSignature.length === String(razorpay_signature).length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(String(razorpay_signature)));

  if (!isValid) {
    res.status(400).json({
      verified: false,
      error: 'Cryptographic payment signature verification failed.',
    });
    return;
  }

  res.json({
    verified: true,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    verifiedAt: new Date().toISOString(),
  });
});

// Razorpay Webhook Endpoint with Duplicate Event Protection
app.post('/api/razorpay/webhook', (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  const cfg = loadRazorpayConfig();

  if (!cfg.webhookSecret || !signature) {
    res.status(400).json({ error: 'Webhook secret or signature header missing.' });
    return;
  }

  const rawBody = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', cfg.webhookSecret).update(rawBody).digest('hex');

  if (expected !== signature) {
    res.status(401).json({ error: 'Invalid webhook signature.' });
    return;
  }

  const eventId = (req.headers['x-razorpay-event-id'] as string) || req.body?.event || `evt_${Date.now()}`;
  let processedEvents: Record<string, string> = {};
  if (fs.existsSync(WEBHOOK_EVENTS_FILE)) {
    try {
      processedEvents = JSON.parse(fs.readFileSync(WEBHOOK_EVENTS_FILE, 'utf-8'));
    } catch {
      processedEvents = {};
    }
  }

  // Idempotent duplicate protection
  if (processedEvents[eventId]) {
    res.json({ status: 'duplicate_ignored', eventId });
    return;
  }

  processedEvents[eventId] = new Date().toISOString();
  fs.writeFileSync(WEBHOOK_EVENTS_FILE, JSON.stringify(processedEvents, null, 2));

  res.json({ status: 'verified_and_processed', eventId, event: req.body?.event });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Doomcord server running on http://0.0.0.0:${PORT} (Owner UID: ${bootstrappedOwner.uid})`);
  });
}

startServer();
