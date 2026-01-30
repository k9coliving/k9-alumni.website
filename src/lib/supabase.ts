import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role key for server-side operations (bypasses RLS)
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
  const { data, error } = await supabase
    .from('residents')
    .select('*')
    .order('years_in_k9');

  if (error) {
    throw new Error(`Failed to fetch residents data: ${error.message}`);
  }

  return data || [];
}

export async function getResidentById(id: string): Promise<ResidentRecord | null> {
  const { data, error } = await supabase
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
  let query = supabase
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

export async function getResidentsByIds(ids: string[]): Promise<ResidentRecord[]> {
  const { data, error } = await supabase
    .from('residents')
    .select('*')
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to fetch residents: ${error.message}`);
  }

  return data || [];
}

export async function addResident(newResident: Omit<ResidentRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ResidentRecord> {
  const { data, error } = await supabase
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

