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