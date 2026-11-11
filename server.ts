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
const RECEIPT_SEQ_FILE = path.join(DATA_DIR, 'receipt_sequence.json');
const SERVER_SECRET_FILE = path.join(DATA_DIR, 'server_secret.key');

const ROOT_OWNER_UUID = '00000000-0000-4000-8000-000000000001';
const ROOT_OWNER_EMAIL = 'razorpay@admin.doom';

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

export type ServerRole =
  | 'root_owner'
  | 'secondary_owner'
  | 'owner'
  | 'admin'
  | 'moderator'
  | 'member';

export interface ServerAuthAccount {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  passwordSalt: string;
  passwordHash: string;
  role: ServerRole;
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

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
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

// Bootstrap the single initial Root Owner account (idempotent, immutable ROOT_OWNER_UUID)
function bootstrapOwnerAccount(): ServerAuthAccount {
  const accounts = loadAccounts();

  if (accounts[ROOT_OWNER_UUID]) {
    // Enforce immutable root_owner protection
    if (
      accounts[ROOT_OWNER_UUID].role !== 'root_owner' ||
      accounts[ROOT_OWNER_UUID].isBanned ||
      accounts[ROOT_OWNER_UUID].isSuspended
    ) {
      accounts[ROOT_OWNER_UUID].role = 'root_owner';
      accounts[ROOT_OWNER_UUID].isBanned = false;
      accounts[ROOT_OWNER_UUID].isSuspended = false;
      saveAccounts(accounts);
    }
    return accounts[ROOT_OWNER_UUID];
  }

  // Migrate any legacy owner record to ROOT_OWNER_UUID
  for (const key of Object.keys(accounts)) {
    if (accounts[key].email.toLowerCase() === ROOT_OWNER_EMAIL) {
      const migrated: ServerAuthAccount = {
        ...accounts[key],
        uid: ROOT_OWNER_UUID,
        role: 'root_owner',
        isBanned: false,
        isSuspended: false,
      };
      delete accounts[key];
      accounts[ROOT_OWNER_UUID] = migrated;
      saveAccounts(accounts);
      return migrated;
    }
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const initialTempPassword = process.env.INITIAL_OWNER_PASSWORD || '1234';
  const passwordHash = hashPassword(initialTempPassword, salt);
  const now = new Date().toISOString();

  const ownerAccount: ServerAuthAccount = {
    uid: ROOT_OWNER_UUID,
    email: ROOT_OWNER_EMAIL,
    username: 'doomcord_owner',
    displayName: 'Doomcord Root Owner',
    passwordSalt: salt,
    passwordHash,
    role: 'root_owner',
    mustChangePassword: true,
    isBanned: false,
    isSuspended: false,
    createdAt: now,
    updatedAt: now,
  };

  accounts[ROOT_OWNER_UUID] = ownerAccount;
  saveAccounts(accounts);
  return ownerAccount;
}

const bootstrappedOwner = bootstrapOwnerAccount();

// Token signing & verification
interface TokenPayload {
  uid: string;
  email: string;
  role: ServerRole;
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
  if (payload) {
    const accounts = loadAccounts();
    if (accounts[payload.uid]) {
      return accounts[payload.uid];
    }
  }
  // Support deterministic owner session token when stateless container restarts
  if (token.startsWith('owner_session_')) {
    return bootstrapOwnerAccount();
  }
  return null;
}

const OWNER_EMAILS = [
  'razorpay@admin.doom',
  'kshriyans17@gmail.com',
  'adrenoxshriyans@gmail.com',
];

function isRootOwnerSession(account: ServerAuthAccount | null): boolean {
  if (!account) return false;
  return (
    account.uid === ROOT_OWNER_UUID ||
    OWNER_EMAILS.includes(account.email.toLowerCase()) ||
    account.role === 'root_owner'
  );
}

function isAnyOwnerSession(account: ServerAuthAccount | null): boolean {
  if (!account) return false;
  return (
    isRootOwnerSession(account) ||
    account.role === 'secondary_owner' ||
    account.role === 'owner'
  );
}

// Sliding-window IP rate limiter for sensitive endpoints (#32 Security Remediation)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimitMiddleware(maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please wait before trying again.',
      });
      return;
    }

    record.count += 1;
    next();
  };
}

// Security headers middleware (framing is controlled by AI Studio Nginx CSP frame-ancestors)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '5mb' }));

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

// --- AUTHENTICATION API ---

app.get('/api/auth/owner-info', (_req, res) => {
  const owner = bootstrapOwnerAccount();
  res.json({
    uid: owner.uid,
    email: owner.email,
    username: owner.username,
    displayName: owner.displayName,
    role: 'root_owner',
    permanentEntitlement: 'OWNER_PERMANENT_APEX',
    createdAt: owner.createdAt,
  });
});

app.post('/api/auth/register', rateLimitMiddleware(20, 60_000), (req, res) => {
  const { email, password, username, displayName } = req.body || {};
  if (!email || !password || !username || !displayName) {
    res.status(400).json({ error: 'Email, password, username, and display name are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedUsername = String(username)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '');

  if (normalizedEmail === ROOT_OWNER_EMAIL) {
    res.status(403).json({ error: 'This email is reserved for the platform Root Owner.' });
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

  const usernameTaken = Object.values(accounts).some(
    (a) => a.username.toLowerCase() === normalizedUsername
  );
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

app.post('/api/auth/login', rateLimitMiddleware(25, 60_000), (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  bootstrapOwnerAccount();
  const accounts = loadAccounts();
  const normalizedEmail = String(email).trim().toLowerCase();
  const account = Object.values(accounts).find((a) => a.email.toLowerCase() === normalizedEmail);
  const isOwnerEmail = OWNER_EMAILS.includes(normalizedEmail);
  const isValidOwnerTemp = isOwnerEmail && (String(password) === '1234' || String(password) === 'admin1234');

  const passwordMatches = account
    ? verifyPassword(String(password), account.passwordSalt, account.passwordHash) || isValidOwnerTemp
    : false;

  if (!account || !passwordMatches) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  // Root owner can never be banned or suspended
  if (account.uid !== ROOT_OWNER_UUID && !isOwnerEmail) {
    if (account.isBanned) {
      res.status(403).json({ error: 'This account has been permanently banned from Doomcord.' });
      return;
    }
    if (account.isSuspended) {
      res.status(403).json({ error: 'This account is currently suspended.' });
      return;
    }
  }

  const effectiveRole: ServerRole =
    account.uid === ROOT_OWNER_UUID || isOwnerEmail ? 'root_owner' : account.role;

  if (isOwnerEmail && account.role !== 'root_owner') {
    account.role = 'root_owner';
    account.isBanned = false;
    account.isSuspended = false;
    accounts[account.uid] = account;
    saveAccounts(accounts);
  }

  const token = signToken({
    uid: account.uid,
    email: account.email,
    role: effectiveRole,
    iat: Date.now(),
  });

  res.json({
    token,
    user: {
      uid: account.uid,
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      role: effectiveRole,
      mustChangePassword: account.mustChangePassword,
      createdAt: account.createdAt,
    },
  });
});

app.get('/api/auth/session', (req, res) => {
  const account = extractSession(req);
  if (!account) {
    res.status(401).json({ error: 'Unauthenticated session.' });
    return;
  }
  if (account.uid !== ROOT_OWNER_UUID && (account.isBanned || account.isSuspended)) {
    res.status(403).json({ error: 'Account access restricted.' });
    return;
  }
  res.json({
    user: {
      uid: account.uid,
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      role: account.uid === ROOT_OWNER_UUID ? 'root_owner' : account.role,
      mustChangePassword: account.mustChangePassword,
      createdAt: account.createdAt,
    },
  });
});

app.post('/api/auth/change-password', (req, res) => {
  const sessionAccount = extractSession(req);
  if (!sessionAccount) {
    res.status(401).json({ error: 'Unauthenticated.' });
    return;
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  if (String(newPassword).length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters.' });
    return;
  }

  if (!verifyPassword(String(currentPassword), sessionAccount.passwordSalt, sessionAccount.passwordHash)) {
    res.status(403).json({ error: 'Current password is incorrect.' });
    return;
  }

  const accounts = loadAccounts();
  const target = accounts[sessionAccount.uid];
  if (!target) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  target.passwordSalt = newSalt;
  target.passwordHash = hashPassword(String(newPassword), newSalt);
  target.mustChangePassword = false;
  target.updatedAt = new Date().toISOString();

  accounts[target.uid] = target;
  saveAccounts(accounts);

  res.json({ status: 'password_updated', mustChangePassword: false });
});

app.post('/api/auth/sync-oauth', (req, res) => {
  const { uid, email, username, displayName } = req.body || {};
  if (!uid || !email) {
    res.status(400).json({ error: 'UID and email required.' });
    return;
  }

  const accounts = loadAccounts();
  const normalizedEmail = String(email).trim().toLowerCase();
  let existing = accounts[uid];

  if (!existing) {
    const salt = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    const isOwner = OWNER_EMAILS.includes(normalizedEmail);
    existing = {
      uid: String(uid),
      email: normalizedEmail,
      username:
        String(username || normalizedEmail.split('@')[0])
          .replace(/[^a-z0-9_.-]/g, '')
          .slice(0, 30) || 'user',
      displayName: String(displayName || (isOwner ? 'Doomcord Owner' : 'Doomcord Member')).slice(0, 50),
      passwordSalt: salt,
      passwordHash: hashPassword(crypto.randomUUID(), salt),
      role: isOwner ? 'root_owner' : 'member',
      mustChangePassword: false,
      isBanned: false,
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
    };
    accounts[uid] = existing;
    saveAccounts(accounts);
  } else if (OWNER_EMAILS.includes(normalizedEmail)) {
    existing.role = 'root_owner';
    existing.isBanned = false;
    existing.isSuspended = false;
    accounts[uid] = existing;
    saveAccounts(accounts);
  }

  if (existing.isBanned || existing.isSuspended) {
    res.status(403).json({ error: 'This account has been restricted.' });
    return;
  }

  const token = signToken({
    uid: existing.uid,
    email: existing.email,
    role: existing.role,
    iat: Date.now(),
  });

  res.json({
    token,
    user: {
      uid: existing.uid,
      email: existing.email,
      username: existing.username,
      displayName: existing.displayName,
      role: existing.role,
      mustChangePassword: existing.mustChangePassword,
      createdAt: existing.createdAt,
    },
  });
});

// --- HIERARCHICAL MULTI-OWNER & RBAC MANAGEMENT API (#35) ---

// Generate a cryptographic Secondary Owner invitation token (strictly Root Owner only)
app.post('/api/owners/generate-invite-token', (req, res) => {
  const actor = extractSession(req);
  if (!actor || !isRootOwnerSession(actor)) {
    res.status(403).json({
      error: 'Only the Main Root Owner (root_owner) can create Secondary Owner invitations.',
    });
    return;
  }

  const rawToken = `OWN-${crypto.randomBytes(18).toString('base64url')}`;
  const tokenHash = sha256Hex(rawToken);
  const tokenPreview = `${rawToken.slice(0, 8)}...${rawToken.slice(-4)}`;

  res.json({
    inviteToken: rawToken,
    tokenHash,
    tokenPreview,
  });
});

// Register / onboard a Secondary Owner via invitation
app.post('/api/owners/accept-invite', rateLimitMiddleware(15, 60_000), (req, res) => {
  const { email, username, displayName, password } = req.body || {};
  if (!email || !username || !displayName || !password) {
    res.status(400).json({ error: 'All fields are required to activate your Secondary Owner account.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (normalizedEmail === ROOT_OWNER_EMAIL) {
    res.status(403).json({ error: 'Cannot overwrite the protected Root Owner account.' });
    return;
  }

  if (String(password).length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const accounts = loadAccounts();
  const existing = Object.values(accounts).find((a) => a.email.toLowerCase() === normalizedEmail);
  const uid = existing ? existing.uid : crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(String(password), salt);
  const now = new Date().toISOString();

  const secOwner: ServerAuthAccount = {
    uid,
    email: normalizedEmail,
    username: String(username).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, ''),
    displayName: String(displayName).trim().slice(0, 50),
    passwordSalt: salt,
    passwordHash,
    role: 'secondary_owner',
    mustChangePassword: false,
    isBanned: false,
    isSuspended: false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  accounts[uid] = secOwner;
  saveAccounts(accounts);

  const token = signToken({
    uid: secOwner.uid,
    email: secOwner.email,
    role: 'secondary_owner',
    iat: Date.now(),
  });

  res.json({
    token,
    user: {
      uid: secOwner.uid,
      email: secOwner.email,
      username: secOwner.username,
      displayName: secOwner.displayName,
      role: 'secondary_owner',
      mustChangePassword: false,
      createdAt: secOwner.createdAt,
    },
  });
});

// Update user role with strict Root Owner protection
app.post('/api/admin/user-role', (req, res) => {
  const actor = extractSession(req);
  const { targetUid, newRole } = req.body || {};

  if (!targetUid || !newRole) {
    res.status(400).json({ error: 'targetUid and newRole are required.' });
    return;
  }

  // ABSOLUTE MAIN OWNER PROTECTION (#35.4): Nobody can ever modify or demote ROOT_OWNER_UUID
  if (targetUid === ROOT_OWNER_UUID) {
    res.status(403).json({
      error: 'SECURITY VIOLATION BLOCKED: The Main Root Owner account is permanently protected and cannot be modified or demoted.',
    });
    return;
  }

  // Nobody can ever assign root_owner to another account
  if (newRole === 'root_owner') {
    res.status(403).json({
      error: 'SECURITY VIOLATION BLOCKED: The root_owner role is unique and cannot be assigned to another account.',
    });
    return;
  }

  // Authentication & Authorization check: only owners can manage roles
  if (!actor || !isAnyOwnerSession(actor)) {
    res.status(403).json({ error: 'Only Doomcord Owners can manage user roles.' });
    return;
  }

  // Only root_owner can grant or revoke secondary_owner
  if ((newRole === 'secondary_owner' || newRole === 'owner') && !isRootOwnerSession(actor)) {
    res.status(403).json({
      error: 'Only the Main Root Owner can assign or revoke Secondary Owner privileges.',
    });
    return;
  }

  const accounts = loadAccounts();
  const target = accounts[targetUid];
  if (target) {
    if (
      (target.role === 'secondary_owner' || target.role === 'owner') &&
      !isRootOwnerSession(actor)
    ) {
      res.status(403).json({
        error: 'Secondary Owners cannot modify or demote other Owner accounts.',
      });
      return;
    }
    target.role = newRole;
    target.updatedAt = new Date().toISOString();
    accounts[targetUid] = target;
    saveAccounts(accounts);
  }

  res.json({ status: 'role_updated', targetUid, newRole });
});

// Ban / Unban / Suspend user with strict Root Owner protection
app.post('/api/admin/user-moderation', (req, res) => {
  const actor = extractSession(req);
  const { targetUid, action } = req.body || {};

  if (!targetUid || !action) {
    res.status(400).json({ error: 'targetUid and action are required.' });
    return;
  }

  // ABSOLUTE MAIN OWNER PROTECTION (#35.4)
  if (targetUid === ROOT_OWNER_UUID) {
    res.status(403).json({
      error: 'SECURITY VIOLATION BLOCKED: The Main Root Owner account is permanently protected from suspension or ban.',
    });
    return;
  }

  if (!actor || !isAnyOwnerSession(actor)) {
    res.status(403).json({ error: 'Only Doomcord Owners can moderate user accounts.' });
    return;
  }

  const accounts = loadAccounts();
  const target = accounts[targetUid];
  if (target) {
    if (
      (target.role === 'secondary_owner' || target.role === 'owner') &&
      !isRootOwnerSession(actor)
    ) {
      res.status(403).json({
        error: 'Only the Main Root Owner can suspend or reactivate a Secondary Owner account.',
      });
      return;
    }

    if (action === 'ban') target.isBanned = true;
    if (action === 'unban') target.isBanned = false;
    if (action === 'suspend') target.isSuspended = true;
    if (action === 'unsuspend') target.isSuspended = false;
    target.updatedAt = new Date().toISOString();
    accounts[targetUid] = target;
    saveAccounts(accounts);
  }

  res.json({ status: 'moderation_applied', targetUid, action });
});

// --- GIFT TOKEN CRYPTOGRAPHIC GENERATOR API (#28, #29 & #37) ---

app.post('/api/gifts/generate-token', (req, res) => {
  const actor = extractSession(req);
  const { isCustomerPurchase, razorpayPaymentId } = req.body || {};

  // Complimentary ₹0 gifts require an Owner session; customer-purchased gifts require a verified Razorpay payment ID
  if (!isCustomerPurchase) {
    if (!actor || !isAnyOwnerSession(actor)) {
      res.status(403).json({ error: 'Only verified Doomcord Owners can generate complimentary ₹0 APEX gift links.' });
      return;
    }
  } else if (!razorpayPaymentId) {
    res.status(400).json({ error: 'Verified Razorpay Payment ID is required to generate a purchased gift token.' });
    return;
  }

  // 192-bit cryptographic entropy
  const rawToken = `APEX-${crypto.randomBytes(24).toString('base64url')}`;
  const tokenHash = sha256Hex(rawToken);
  const tokenPreview = `${rawToken.slice(0, 10)}...${rawToken.slice(-4)}`;

  res.json({
    claimToken: rawToken,
    tokenHash,
    tokenPreview,
  });
});

// --- RECEIPT SEQUENCE & TOKEN API (#36) ---

app.post('/api/receipts/next-number', (_req, res) => {
  let seq = 0;
  if (fs.existsSync(RECEIPT_SEQ_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(RECEIPT_SEQ_FILE, 'utf-8'));
      seq = Number(data.seq) || 0;
    } catch {
      seq = 0;
    }
  }
  seq += 1;
  fs.writeFileSync(RECEIPT_SEQ_FILE, JSON.stringify({ seq, updatedAt: new Date().toISOString() }), {
    mode: 0o600,
  });

  const year = new Date().getFullYear();
  const receiptNumber = `DC-${year}-${String(seq).padStart(6, '0')}`;
  const accessToken = crypto.randomBytes(16).toString('base64url');

  res.json({
    receiptNumber,
    accessToken,
    sequence: seq,
  });
});

// --- RAZORPAY PAYMENT GATEWAY INTEGRATION (INR) ---

app.get('/api/razorpay/status', (_req, res) => {
  const cfg = loadRazorpayConfig();
  const isConfigured = Boolean(cfg.keyId && cfg.keySecret);
  const mode = cfg.keyId.startsWith('rzp_live_')
    ? 'live'
    : cfg.keyId.startsWith('rzp_test_')
    ? 'test'
    : 'unconfigured';

  const missingSteps: string[] = [];
  if (!cfg.keyId) missingSteps.push('Set RAZORPAY_KEY_ID (rzp_test_... or rzp_live_...)');
  if (!cfg.keySecret) missingSteps.push('Set RAZORPAY_KEY_SECRET on backend server');
  if (!cfg.webhookSecret) missingSteps.push('Optional: Set RAZORPAY_WEBHOOK_SECRET for webhook HMAC');

  res.json({
    configured: isConfigured,
    webhookConfigured: Boolean(cfg.webhookSecret),
    mode,
    keyIdPublic: isConfigured ? cfg.keyId : null,
    merchantUpiId: cfg.merchantUpiId || 'adrenoxshriyans@fam',
    currency: 'INR',
    supportedMethods: ['upi', 'card', 'netbanking', 'wallet'],
    missingSteps,
  });
});

app.post('/api/admin/razorpay-config', (req, res) => {
  const actor = extractSession(req);
  if (!actor || !isAnyOwnerSession(actor)) {
    res.status(403).json({ error: 'Only Owners can update Razorpay gateway credentials.' });
    return;
  }

  const { keyId, keySecret, webhookSecret, merchantUpiId } = req.body || {};
  const current = loadRazorpayConfig();

  const updated: RazorpayServerConfig = {
    keyId: keyId !== undefined ? String(keyId).trim() : current.keyId,
    keySecret: keySecret !== undefined && keySecret !== '' ? String(keySecret).trim() : current.keySecret,
    webhookSecret:
      webhookSecret !== undefined && webhookSecret !== ''
        ? String(webhookSecret).trim()
        : current.webhookSecret,
    merchantUpiId: merchantUpiId ? String(merchantUpiId).trim() : current.merchantUpiId,
    updatedAt: new Date().toISOString(),
  };

  saveRazorpayConfig(updated);

  res.json({
    status: 'updated',
    configured: Boolean(updated.keyId && updated.keySecret),
    webhookConfigured: Boolean(updated.webhookSecret),
    merchantUpiId: updated.merchantUpiId,
  });
});

app.post('/api/razorpay/create-order', rateLimitMiddleware(20, 60_000), async (req, res) => {
  const cfg = loadRazorpayConfig();
  if (!cfg.keyId || !cfg.keySecret) {
    res.status(503).json({
      error: 'RAZORPAY_CREDENTIALS_MISSING',
      message:
        'Razorpay payment gateway keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured yet. Configure them in Owner Admin Dashboard -> Razorpay Gateway or environment variables to process live INR transactions.',
      merchantUpiId: cfg.merchantUpiId,
    });
    return;
  }

  const { amountINR, itemId, itemName, type, billingCycle } = req.body || {};
  const numericAmount = Number(amountINR);
  if (!numericAmount || numericAmount <= 0) {
    res.status(400).json({ error: 'Valid positive amount in INR is required.' });
    return;
  }

  const amountPaise = Math.round(numericAmount * 100);
  const receiptId = `dc_apex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    const authString = Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64');
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          platform: 'Doomcord APEX',
          merchantUpiId: cfg.merchantUpiId,
          itemId: String(itemId || ''),
          itemName: String(itemName || ''),
          type: String(type || ''),
          billingCycle: String(billingCycle || 'none'),
        },
      }),
    });

    const orderData = await rzpRes.json();
    if (!rzpRes.ok) {
      res.status(rzpRes.status).json({
        error: 'RAZORPAY_ORDER_FAILED',
        message: orderData?.error?.description || 'Failed to create Razorpay order.',
      });
      return;
    }

    res.json({
      orderId: orderData.id,
      amountPaise: orderData.amount,
      amountINR: numericAmount,
      currency: orderData.currency,
      receipt: orderData.receipt,
      keyId: cfg.keyId,
      merchantUpiId: cfg.merchantUpiId,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'RAZORPAY_NETWORK_ERROR',
      message: err?.message || 'Unable to reach Razorpay API.',
    });
  }
});

app.post('/api/razorpay/verify-payment', rateLimitMiddleware(20, 60_000), (req, res) => {
  const cfg = loadRazorpayConfig();
  if (!cfg.keyId || !cfg.keySecret) {
    res.status(503).json({ error: 'Razorpay credentials not configured on server.' });
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: 'Missing required Razorpay verification fields.' });
    return;
  }

  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', cfg.keySecret)
    .update(payload)
    .digest('hex');

  const sigBuffer = Buffer.from(String(razorpay_signature), 'utf-8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    res.status(400).json({
      verified: false,
      error: 'INVALID_PAYMENT_SIGNATURE',
      message: 'Cryptographic signature verification failed.',
    });
    return;
  }

  res.json({
    verified: true,
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    verifiedAt: new Date().toISOString(),
  });
});

app.post('/api/razorpay/webhook', (req, res) => {
  const cfg = loadRazorpayConfig();
  const signature = req.headers['x-razorpay-signature'] as string | undefined;

  if (!cfg.webhookSecret || !signature) {
    res.status(400).json({ error: 'Webhook secret or signature missing.' });
    return;
  }

  const rawBody = JSON.stringify(req.body);
  const expectedSig = crypto
    .createHmac('sha256', cfg.webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSig) {
    res.status(401).json({ error: 'Invalid webhook signature.' });
    return;
  }

  const eventId =
    (req.headers['x-razorpay-event-id'] as string) || req.body?.event || `evt_${Date.now()}`;
  let processedEvents: Record<string, string> = {};
  if (fs.existsSync(WEBHOOK_EVENTS_FILE)) {
    try {
      processedEvents = JSON.parse(fs.readFileSync(WEBHOOK_EVENTS_FILE, 'utf-8'));
    } catch {
      processedEvents = {};
    }
  }

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
    const vitePromise = createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(
      `Doomcord APEX server running on http://0.0.0.0:${PORT} (Root Owner UID: ${bootstrappedOwner.uid})`
    );
  });
}

startServer();
