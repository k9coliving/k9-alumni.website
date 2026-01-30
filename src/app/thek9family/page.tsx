import Layout from '@/components/Layout';
import { getResidentsData, getResidentById, verifyEditToken, type ResidentRecord } from '@/lib/supabase';
import K9FamilyClient from './K9FamilyClient';
import { logger } from '@/lib/logger';

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
  placeholderImage?: string;
  currentlyLivingInHouse: boolean;
  birthday?: Date | null;
  involvementLevel?: string;
  otherInvolvementText?: string;
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
    } : undefined,
    placeholderImage: record.preferences?.placeholder_image,
    currentlyLivingInHouse: record.currently_living_in_house || false,
    birthday: record.birthday || null,
    involvementLevel: record.preferences?.involvement_level,
    otherInvolvementText: record.preferences?.other_involvement_text
  };
}

interface PageProps {
  searchParams: Promise<{
    edit?: string;
    token?: string;
  }>;
}

export default async function Database({ searchParams }: PageProps) {
  const { edit: editId, token } = await searchParams;
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

  // Check if we have edit parameters and validate the token
  let editingResident: AlumniMember | null = null;
  let editTokenError: string | null = null;

  if (editId && token) {
    const tokenResult = await verifyEditToken(editId, token);
    if (tokenResult.valid) {
      const resident = await getResidentById(editId);
      if (resident) {
        editingResident = transformResidentRecord(resident);
        logger.info('User accessed page with valid edit credentials', {
          page: 'thek9family',
          residentId: editId,
          residentName: resident.name
        });
      } else {
        editTokenError = 'Resident not found';
        logger.warn('Edit credentials valid but resident not found', {
          page: 'thek9family',
          residentId: editId,
          error: 'Resident not found'
        });
      }
    } else {
      editTokenError = tokenResult.error || 'Invalid edit link';
      logger.warn('User accessed page with invalid edit credentials', {
        page: 'thek9family',
        residentId: editId,
        error: tokenResult.error || 'Invalid edit link'
      });
    }
  }

  return (
    <Layout>
      <K9FamilyClient
        initialMembers={alumniMembers}
        filterOptions={filterOptions}
        editingResident={editingResident}
        editTokenError={editTokenError}
        editToken={editingResident ? token : undefined}
      />
    </Layout>
  );
}