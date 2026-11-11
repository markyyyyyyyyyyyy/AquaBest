import { supabase, supabaseConfigured } from './supabaseClient.js';

const BUSINESS_ROLES = new Set(['owner', 'manager', 'staff', 'delivery']);

function requireSupabase() {
  if (!supabaseConfigured) {
    throw new Error('Staff sign-in is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
}

async function loadActiveEmployee(user) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, auth_user_id, full_name, primary_role, active')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (error) throw new Error('Could not verify staff access. Contact the administrator.');
  if (!data || !data.active || !BUSINESS_ROLES.has(data.primary_role)) {
    throw new Error('This account is not enabled for staff access. Contact the administrator.');
  }

  return {
    id: data.id,
    authUserId: user.id,
    email: user.email,
    fullName: data.full_name,
    role: data.primary_role,
  };
}

async function verifyEmployeeOrSignOut(user) {
  try {
    return await loadActiveEmployee(user);
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
}

export async function signInBusiness(emailInput, password) {
  requireSupabase();
  const email = String(emailInput ?? '').trim().toLowerCase();
  if (!email || !password) throw new Error('Enter your work email and password.');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error('Email or password is incorrect.');
  return verifyEmployeeOrSignOut(data.user);
}

export async function getBusinessSession() {
  requireSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error('Could not restore your staff session. Please sign in again.');
  if (!data.session?.user) return null;
  return verifyEmployeeOrSignOut(data.session.user);
}

export async function signOutBusiness() {
  requireSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Could not sign out cleanly. Please reload and try again.');
}
