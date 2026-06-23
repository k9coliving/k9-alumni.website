import Layout from '@/components/Layout';
import Image from 'next/image';
import TeamMembersClient from '@/components/TeamMembersClient';
import { getTeamMembers } from '@/lib/supabase';

// Landing-page fonts (loaded in layout.tsx) so this page matches its look.
const SERIF = 'var(--font-dm-serif), "DM Serif Display", serif';
const BODY = 'var(--font-nunito), "Nunito", system-ui, sans-serif';
const HAND = 'var(--font-caveat), "Caveat", cursive';

// Hardcoded team members (for people without database records or special entries)
const hardcodedTeamMembers = [
  {
    name: "Flow",
    role: "Map Master",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/flow.jpg`
  },
  {
    name: "Annelise",
    role: "Chief Event Officer",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/annelise.jpg`
  },
  {
    name: "You?",
    role: "Join our team!",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/who.png`
  }
];

async function loadTeamMembers() {
  try {
    // Fetch team members from the database (filtered at SQL level)
    const teamMembers = await getTeamMembers();

    // Convert to team member format
    const databaseMembers = teamMembers.map(resident => ({
      name: resident.preferences?.nickname || resident.name,
      role: resident.preferences?.team_role,
      image: resident.preferences?.team_image_url || resident.photo_url,
      hasUuid: true,
      actualName: resident.name // Store the actual name for filtering
    }));

    // Combine database members with hardcoded members
    const allMembers = [
      ...databaseMembers,
      ...hardcodedTeamMembers.map(member => ({ ...member, hasUuid: false }))
    ];

    return allMembers;
  } catch (error) {
    console.error('Error loading team members:', error);
    return [];
  }
}

export default async function WhoAreWe() {
  const teamMembers = await loadTeamMembers();

  return (
    <Layout>
      <div className="min-h-screen" style={{ backgroundColor: '#FAF6F0' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="page-header">
            <h1 className="mb-4" style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(52px,10vw,108px)', lineHeight: 0.98, letterSpacing: '-1px', color: '#1B2A41' }}>
              This is Us
            </h1>
            <p className="page-header-subtitle" style={{ fontFamily: BODY }}>
              Meet the team behind the K9 Alumni Network
            </p>
          </div>

          <TeamMembersClient teamMembers={teamMembers} />

          <div className="max-w-4xl mx-auto px-4 mt-16">
            <Image src="/house.png" alt="" width={160} height={160} className="nl-bob block mx-auto mb-4" />
            <h2 className="text-4xl sm:text-5xl text-center" style={{ fontFamily: SERIF, fontWeight: 400, color: '#1B2A41' }}>
              Why an alumni network?
            </h2>
            <svg width="120" height="13" viewBox="0 0 120 13" fill="none" aria-hidden="true" className="mx-auto mt-2 mb-8">
              <path d="M3 8 Q 32 2 60 7 T 117 6" stroke="#E1564D" strokeWidth="3.2" strokeLinecap="round" />
            </svg>
            <div className="prose prose-lg sm:prose-xl max-w-none text-gray-700 leading-relaxed space-y-6" style={{ fontFamily: BODY }}>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                We&apos;ve all called K9 home and been transformed by the incredible community and family we discovered there. 
                While we may no longer live within those walls, the connections we forged run far too deep to abandon.
              </p>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                What we built together—these relationships, this sense of belonging—is too precious to let slip away just because life takes us elsewhere.
              </p>
              <div className="text-center mt-12 mb-16">
                <p className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: HAND, color: '#1B2A41' }}>
                  The K9 Alumni Network team
                </p>
                <Image src="/dog-cat-turtle.png" alt="" width={200} height={200} className="nl-bob block mx-auto mt-4" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}