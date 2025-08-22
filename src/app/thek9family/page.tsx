import Layout from '@/components/Layout';
import { getResidentsData, type ResidentRecord } from '@/lib/supabase';
import K9FamilyClient from './K9FamilyClient';

interface AlumniMember {
  id: string;
  name: string;
  location: string;
  profession: string;
  interests: string[];
  yearsInK9: string;
  description: string;
  email: string;
  photo?: {
    url: string;
    alt: string;
  };
}

// Helper function to transform Supabase data to component format
function transformResidentRecord(record: ResidentRecord): AlumniMember {
  return {
    id: record.id,
    name: record.name,
    location: record.location || 'Location not specified',
    profession: record.profession || 'Alumni',
    interests: record.interests || [],
    yearsInK9: record.years_in_k9 || 'Unknown period',
    description: record.description || '',
    email: record.email || '',
    photo: record.photo_url ? {
      url: record.photo_url,
      alt: record.photo_alt || `${record.name} profile photo`
    } : undefined
  };
}

export default async function Database() {
  const supabaseData = await getResidentsData();
  
  // Transform Supabase data to match component expectations
  const alumniMembers: AlumniMember[] = supabaseData.map(transformResidentRecord);

  // Extract unique values for filters
  const uniqueLocations = [...new Set(alumniMembers.map(member => member.location.split(',')[0].trim()))].filter(Boolean).sort();
  const uniqueInterests = [...new Set(alumniMembers.flatMap(member => member.interests))].filter(Boolean).sort();

  const filterOptions = {
    cities: uniqueLocations.slice(0, 10), // Show top 10 cities
    interests: uniqueInterests.slice(0, 15), // Show top 15 interests
    periods: [...new Set(alumniMembers.map(member => member.yearsInK9))].filter(Boolean).sort()
  };

  return (
    <Layout>
      <K9FamilyClient 
        initialMembers={alumniMembers}
        filterOptions={filterOptions}
      />
    </Layout>
  );
}