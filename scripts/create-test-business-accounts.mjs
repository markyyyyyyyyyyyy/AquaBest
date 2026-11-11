import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const parseEnv = (text) => Object.fromEntries(
  text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const splitAt = line.indexOf('=');
      const key = line.slice(0, splitAt).trim();
      const value = line.slice(splitAt + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
      return [key, value];
    }),
);

async function readEnvFile(path) {
  try { return parseEnv(await readFile(path, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

const [publicEnv, adminEnv] = await Promise.all([
  readEnvFile(resolve(root, '.env')),
  readEnvFile(resolve(root, '.env.admin')),
]);
const supabaseUrl = process.env.SUPABASE_URL || adminEnv.SUPABASE_URL || publicEnv.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || adminEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set SUPABASE_URL and the legacy service_role JWT in the ignored .env.admin file. Never prefix the service key with VITE_.');
}

function getJwtRole(token) {
  try {
    const payload = token.split('.')[1];
    return payload ? JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role : null;
  } catch { return null; }
}

if (getJwtRole(serviceRoleKey) !== 'service_role') {
  throw new Error('This Auth Admin seeder requires the legacy service_role JWT from Supabase Settings > API Keys > Legacy API Keys. Do not use the anon/publishable key or an sb_secret_ key here; this script needs a service_role JWT as its Auth Admin bearer token.');
}

const accounts = [
  { email: 'owner.test@example.com', fullName: 'Test Owner', role: 'owner' },
  { email: 'manager.test@example.com', fullName: 'Test Manager', role: 'manager' },
  { email: 'staff.test@example.com', fullName: 'Test Staff', role: 'staff' },
  { email: 'delivery.test@example.com', fullName: 'Test Delivery', role: 'delivery' },
];

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: userPage, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw new Error(`Could not check existing test accounts: ${listError.message}`);
const existingEmails = new Set((userPage.users ?? []).map((user) => user.email?.toLowerCase()));
const existing = accounts.filter((account) => existingEmails.has(account.email));
if (existing.length) {
  throw new Error(`Nothing was created. These test emails already exist: ${existing.map((account) => account.email).join(', ')}. Review them in Supabase Auth before rerunning.`);
}

const created = [];
try {
  for (const account of accounts) {
    const password = randomBytes(24).toString('base64url');
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`Could not create ${account.role} test user: ${error?.message ?? 'No user returned.'}`);

    created.push({ ...account, password, authUserId: data.user.id });
    const { error: profileError } = await supabase.from('employees').insert({
      auth_user_id: data.user.id,
      full_name: account.fullName,
      primary_role: account.role,
      active: true,
    });
    if (profileError) throw new Error(`Could not link ${account.role} test user to public.employees: ${profileError.message}`);
  }
} catch (error) {
  const rollbackErrors = [];
  for (const account of created.reverse()) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(account.authUserId);
    if (deleteError) rollbackErrors.push(`${account.email}: ${deleteError.message}`);
  }
  if (rollbackErrors.length) {
    throw new Error(`${error.message} Rollback also failed for ${rollbackErrors.join('; ')}. Review Supabase Auth and public.employees.`);
  }
  throw error;
}

console.log('Created temporary test accounts in the configured Supabase project. Save these generated passwords securely:');
console.log(JSON.stringify(created.map(({ email, password, role }) => ({ email, password, role })), null, 2));
console.log('These example.com addresses are for testing only and cannot receive email or password-reset messages.');
