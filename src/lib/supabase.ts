import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// DEPRECATED: Anon key client - not used in this application
// All backend operations use supabaseAdmin (service role key) instead.
//
// Background: After the January 2026 security incident (see docs/security-incident-2026-01.md),
// all RLS policies were removed from the database. This application uses a simpler security model:
// - Site-level password protection (SITE_PASSWORD)
// - Backend-only database access via service role key
// - No client-side Supabase calls
//
// Given that we only have one password protecting the website, RLS doesn't really make sense. If you're in the website, then you're
// allowed to make changes on all rows in the tables. There's a question of whether we want to keep this as it is for editing and 
// deleting of residents, events and tips - since they basically login individually via access to the email, but I'll need to understand
// RLS better and make some experiments before going that route. 
// 
// The incident occured because the RLS policies were overly permissive. 
//
// The anon key client is affected by RLS policies, so it cannot be used now that RLS is disabled.
// Keeping this export for reference, but DO NOT USE in backend operations.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role key for server-side operations (bypasses RLS)
// ALL backend operations should use this client.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Type definitions for our database tables
export interface EditTokenData {
  token: string;
  expires_at: string;
  email_sent_at: string;
}

export interface ResidentRecord {
  id: string;
  airtable_id?: string;
  name: string;
  location?: string;
  profession?: string;
  interests: string[];
  years_in_k9?: string;
  description?: string;
  email?: string;
  photo_url?: string;
  photo_alt?: string;
  preferences?: {
    involvement_level?: string;
    involvement_level_full?: string;
    other_involvement_text?: string;
    placeholder_image?: string;
    is_team_member?: boolean;
    nickname?: string;
    team_role?: string;
    team_image_url?: string;
  };
  birthday?: Date;
  currently_living_in_house?: boolean;
  edit_token?: EditTokenData;
  created_at?: string;
  updated_at?: string;
}

// Database functions
export async function getResidentsData(): Promise<ResidentRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('residents')
    .select('*')
    .order('years_in_k9');

  if (error) {
    throw new Error(`Failed to fetch residents data: ${error.message}`);
  }

  return data || [];
}

export async function getTeamMembers(): Promise<ResidentRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('residents')
    .select('*')
    .eq('preferences->>is_team_member', true)
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch team members: ${error.message}`);
  }

  return data || [];
}

export async function getResidentById(id: string): Promise<ResidentRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('residents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rows found
    }
    throw new Error(`Failed to fetch resident: ${error.message}`);
  }

  return data;
}

export async function searchResidents(filters: {
  name?: string;
  location?: string;
  interests?: string;
  yearsInK9?: string;
}): Promise<ResidentRecord[]> {
  let query = supabaseAdmin
    .from('residents')
    .select('*');

  // Apply filters
  if (filters.name) {
    query = query.ilike('name', `%${filters.name}%`);
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters.interests) {
    query = query.contains('interests', [filters.interests]);
  }

  if (filters.yearsInK9) {
    query = query.eq('years_in_k9', filters.yearsInK9);
  }

  query = query.order('name');

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to search residents: ${error.message}`);
  }

  return data || [];
}

export async function addResident(newResident: Omit<ResidentRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ResidentRecord> {
  const { data, error } = await supabaseAdmin
    .from('residents')
    .insert([newResident])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add resident: ${error.message}`);
  }

  return data;
}

export async function updateResident(id: string, updates: Partial<Omit<ResidentRecord, 'id' | 'created_at'>>): Promise<ResidentRecord> {
  const { data, error } = await supabaseAdmin
    .from('residents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update resident: ${error.message}`);
  }

  return data;
}

// Edit token management
export async function setEditToken(residentId: string, token: string, expiresInHours: number = 24): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  const editToken: EditTokenData = {
    token,
    expires_at: expiresAt.toISOString(),
    email_sent_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin
    .from('residents')
    .update({ edit_token: editToken, updated_at: new Date().toISOString() })
    .eq('id', residentId);

  if (error) {
    throw new Error(`Failed to set edit token: ${error.message}`);
  }
}

export async function verifyEditToken(residentId: string, token: string): Promise<{ valid: boolean; error?: string }> {
  const resident = await getResidentById(residentId);

  if (!resident) {
    return { valid: false, error: 'Resident not found' };
  }

  if (!resident.edit_token) {
    return { valid: false, error: 'No edit token found' };
  }

  if (resident.edit_token.token !== token) {
    return { valid: false, error: 'Invalid token' };
  }

  if (new Date(resident.edit_token.expires_at) < new Date()) {
    return { valid: false, error: 'Token has expired' };
  }

  return { valid: true };
}

