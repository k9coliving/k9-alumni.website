import Layout from '@/components/Layout';
import TeamMembersClient from '@/components/TeamMembersClient';
import { getResidentsByIds } from '@/lib/supabase';

const teamMemberIds = [
  "6d06684d-5934-4e0e-95ca-79b187ff5d54", // Abhi
  "3c533489-54f5-4db4-ae2a-a4badb05dc61", // Mo
  "e8924b97-10b3-460c-9e85-4662979d8f6f", // Jho
  {
    name: "Flow",
    role: "Map Master",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/flow.jpg`
  },
  "69589ae9-f47e-4307-9166-d23f1ecb54bf", // Per
  {
    name: "Annelise",
    role: "Chief Event Officer",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/annelise.jpg`
  },
  "47749294-7c80-4b33-8157-b8e48659a0b9", // Camelia
  {
    name: "You?",
    role: "Join our team!",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/who.png`
  }
];

async function loadTeamMembers() {
  try {
    // Extract UUIDs from teamMemberIds
    const uuids = teamMemberIds.filter(item => typeof item === 'string');

    // Fetch all residents with team member UUIDs in one query
    const residents = await getResidentsByIds(uuids);

    // Create a lookup map for quick access
    const residentMap = new Map();
    residents.forEach(resident => {
      if (resident.preferences?.is_team_member) {
        residentMap.set(resident.id, resident);
      }
    });

    // Build team members array
    const members = teamMemberIds.map(memberConfig => {
      // If it's a string (UUID), get from database
      if (typeof memberConfig === 'string') {
        const resident = residentMap.get(memberConfig);
        if (resident) {
          return {
            name: resident.preferences?.nickname || resident.name,
            role: resident.preferences?.team_role,
            image: resident.preferences?.team_image_url || resident.photo_url,
            hasUuid: true,
            actualName: resident.name // Store the actual name for filtering
          };
        }
        return null;
      }
      // If it's an object, use as-is (Flow, Annelise, You?)
      return { ...memberConfig, hasUuid: false };
    }).filter(member => member !== null);

    return members;
  } catch (error) {
    console.error('Error loading team members:', error);
    return [];
  }
}

export default async function WhoAreWe() {
  const teamMembers = await loadTeamMembers();

  return (
    <Layout>
      <div className="min-h-screen relative" style={{
        background: `
          radial-gradient(circle at 10px 10px, rgba(156, 163, 175, 0.15) 1px, transparent 1px)
        `,
        backgroundColor: '#f9fafb',
        backgroundSize: '20px 20px'
      }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="page-header">
            <h1 className="page-header-title">
              This is Us
            </h1>
            <div className="page-header-divider"></div>
            <p className="page-header-subtitle">
              Meet the team behind the K9 Alumni Network
            </p>
          </div>

          <TeamMembersClient teamMembers={teamMembers} />

          <div className="max-w-4xl mx-auto px-4 mt-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-8">
              Why an alumni network?
            </h2>
            <div className="prose prose-lg sm:prose-xl max-w-none text-gray-700 leading-relaxed space-y-6">
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                We&apos;ve all called K9 home and been transformed by the incredible community and family we discovered there. 
                While we may no longer live within those walls, the connections we forged run far too deep to abandon.
              </p>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                What we built together—these relationships, this sense of belonging—is too precious to let slip away just because life takes us elsewhere.
              </p>
              <div className="text-center mt-12 mb-16">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-parisienne">
                  The K9 Alumni Network team
                </p>
                <p className="text-3xl">
                  ❤️ 🤗
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}