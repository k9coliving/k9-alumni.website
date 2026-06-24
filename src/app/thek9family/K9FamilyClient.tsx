'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import ProfileForm, { type ProfileFormData } from '@/components/ProfileForm';
import JoinCallToAction from '@/components/JoinCallToAction';
import BaseModal from '@/components/BaseModal';
import { FONT_DISPLAY, FONT_HAND, INK, PALETTE, firstNameOf } from '@/components/newsletter/theme';

// Newsletter-aligned design tokens (shared with the landing + who-are-we pages).
const C = {
  bg: '#FAF6F0',
  ink: '#1B2A41',
  accent: '#E1564D',
  body: '#6F695F',
  card: '#FBF7F1',
  cardBorder: '#ECE3D5',
  section: '#F5EEE2',
};
const SERIF = 'var(--font-dm-serif), "DM Serif Display", serif';
const BODY = 'var(--font-nunito), "Nunito", system-ui, sans-serif';

// Playful icon that peeks from the corner of a resident's photo. Kept sparse —
// only every 3rd card gets one — so it stays a delight rather than clutter. Which
// icon is picked deterministically from the resident id, so it stays stable
// across renders (same set the newsletter uses for its decorative badges).
const PHOTO_ICONS = ['heart-pink', 'mug', 'plant', 'airplane', 'camera', 'envelope', 'cat', 'dog-newspaper', 'bird'];
function photoIcon(id: string, index: number): string | null {
  if (index % 3 !== 0) return null;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PHOTO_ICONS[h % PHOTO_ICONS.length];
}

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

interface FilterOptions {
  cities: string[];
  interests: string[];
  periods: string[];
}

// When a resident opts into the newsletter with an email that had previously
// unsubscribed, the API won't silently revive it — it returns
// needsResubscribeConfirm. We ask the person before resubscribing.
async function maybeConfirmResubscribe(email: string, needsResubscribeConfirm: boolean) {
  if (!needsResubscribeConfirm || !email) return;
  const wants = window.confirm(
    `${email} previously unsubscribed from the K9 newsletter. Resubscribe to it?`
  );
  if (!wants) return;
  try {
    await fetch('/api/newsletter/resubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'resident' }),
    });
  } catch (e) {
    console.error('Resubscribe failed', e);
  }
}


interface K9FamilyClientProps {
  initialMembers: AlumniMember[];
  filterOptions: FilterOptions;
  editingResident?: AlumniMember | null;
  editTokenError?: string | null;
  editToken?: string;
}

export default function K9FamilyClient({
  initialMembers,
  editingResident,
  editTokenError,
  editToken
}: K9FamilyClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [members, setMembers] = useState<AlumniMember[]>(initialMembers);
  const [filteredMembers, setFilteredMembers] = useState<AlumniMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editRequestMember, setEditRequestMember] = useState<AlumniMember | null>(null);
  const [editRequestStatus, setEditRequestStatus] = useState<'idle' | 'sending' | 'sent' | 'already_sent' | 'error'>('idle');
  const [editRequestError, setEditRequestError] = useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(!!editingResident);
  const [editingMember, setEditingMember] = useState<AlumniMember | null>(editingResident || null);
  const [currentEditToken, setCurrentEditToken] = useState<string | undefined>(editToken);

  // Initialize search query from URL parameter (only on mount)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Update URL when search query changes
  useEffect(() => {
    const currentSearchParam = searchParams.get('search') || '';

    // Only update URL if the search query is different from what's in the URL
    if (searchQuery.trim() !== currentSearchParam) {
      const params = new URLSearchParams(searchParams.toString());

      if (searchQuery.trim()) {
        params.set('search', searchQuery);
      } else {
        params.delete('search');
      }

      const newSearch = params.toString();
      router.replace(`${pathname}?${newSearch}`, { scroll: false });
    }
  }, [searchQuery, pathname, router, searchParams]);

  // Live search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(member => {
      // Search across name, location, profession, and interests
      const matchesName = member.name.toLowerCase().includes(query);
      const matchesLocation = member.location?.toLowerCase().includes(query) || false;
      const matchesProfession = member.profession?.toLowerCase().includes(query) || false;
      const matchesInterests = member.interests.some(interest =>
        interest.toLowerCase().includes(query)
      );
      const matchesYears = member.yearsInK9?.toLowerCase().includes(query) || false;

      return matchesName || matchesLocation || matchesProfession || matchesInterests || matchesYears;
    });

    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const handleAddProfile = async (formData: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/residents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          location: formData.location,
          profession: formData.profession,
          years_in_k9: formData.yearsInK9,
          description: formData.description,
          interests: formData.interests,
          photo_url: formData.photoUrl || null,
          involvementLevel: formData.involvementLevel,
          otherInvolvementText: formData.otherInvolvementText,
          birthday: formData.birthday,
          currentlyLivingInHouse: formData.currentlyLivingInHouse
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add profile');
      }

      const result = await response.json();
      
      // Convert the new resident to AlumniMember format
      const newMember: AlumniMember = {
        id: result.resident.id,
        name: result.resident.name,
        location: result.resident.location,
        profession: result.resident.profession,
        interests: result.resident.interests,
        yearsInK9: result.resident.years_in_k9,
        description: result.resident.description,
        email: result.resident.email,
        photo: result.resident.photo_url ? {
          url: result.resident.photo_url,
          alt: result.resident.photo_alt || `${result.resident.name} profile photo`
        } : undefined,
        placeholderImage: result.resident.preferences?.placeholder_image,
        currentlyLivingInHouse: result.resident.currently_living_in_house || false
      };

      // Add the new member to the list
      setMembers(prev => [newMember, ...prev]);

      // Show success message
      alert('Profile added successfully! Welcome to the K9 Family directory.');

      await maybeConfirmResubscribe(formData.email, result.needsResubscribeConfirm);

    } catch (error) {
      console.error('Error adding profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to add profile. Please try again.');
      throw error; // Re-throw so the form knows there was an error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProfile = async (formData: ProfileFormData) => {
    if (!editingMember || !currentEditToken) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/residents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingMember.id,
          token: currentEditToken,
          name: formData.name,
          email: formData.email,
          location: formData.location,
          profession: formData.profession,
          years_in_k9: formData.yearsInK9,
          description: formData.description,
          interests: formData.interests,
          photo_url: formData.photoUrl || null,
          currentlyLivingInHouse: formData.currentlyLivingInHouse,
          birthday: formData.birthday,
          involvementLevel: formData.involvementLevel,
          otherInvolvementText: formData.otherInvolvementText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();

      // Update the member in the local list
      const updatedMember: AlumniMember = {
        id: result.resident.id,
        name: result.resident.name,
        location: result.resident.location,
        profession: result.resident.profession,
        interests: result.resident.interests,
        yearsInK9: result.resident.years_in_k9,
        description: result.resident.description,
        email: result.resident.email,
        photo: result.resident.photo_url ? {
          url: result.resident.photo_url,
          alt: result.resident.photo_alt || `${result.resident.name} profile photo`
        } : undefined,
        placeholderImage: result.resident.preferences?.placeholder_image,
        currentlyLivingInHouse: result.resident.currently_living_in_house || false
      };

      setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      setIsEditModalOpen(false);
      setEditingMember(null);
      setCurrentEditToken(undefined);

      // Clear URL parameters
      window.history.replaceState({}, '', '/thek9family');

      alert('Profile updated successfully!');

      await maybeConfirmResubscribe(formData.email, result.needsResubscribeConfirm);

    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: C.bg, fontFamily: BODY, color: C.ink }}>
        {/* Edit token error banner */}
        {editTokenError && (
          <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="text-red-800 font-medium">Edit link invalid</p>
                  <p className="text-red-600 text-sm">
                    {editTokenError === 'Token has expired'
                      ? 'This edit link has expired. Please request a new one using the Edit button on your profile.'
                      : editTokenError === 'Token has already been used'
                      ? 'This edit link has already been used. Please request a new one if you need to make more changes.'
                      : 'This edit link is not valid. Please request a new one using the Edit button on your profile.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="page-header !mb-6 flex flex-col items-center">
            <h1
              className="m-0"
              style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(52px,10vw,108px)', lineHeight: 0.98, letterSpacing: '-1px', color: C.ink }}
            >
              The K9 Family
            </h1>
            <p
              className="mt-5 mx-auto"
              style={{ fontFamily: BODY, fontSize: 'clamp(15px,1.8vw,18px)', lineHeight: 1.7, color: C.body, maxWidth: 540 }}
            >
              Connect with fellow K9 alumni around the world. Find roommates, get life advice,
              or simply catch up with old friends.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, location, profession, interests, or K9 period..."
              className="w-full px-5 py-3.5 rounded-2xl border border-[#ECE3D5] bg-white shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-[#E1564D]/30 focus:border-[#E1564D] transition-colors"
              style={{ fontFamily: BODY, color: C.ink }}
            />
            <div className="text-center mt-2 mb-16">
              <p className="text-sm" style={{ fontFamily: BODY, color: C.body }}>
                {searchQuery
                  ? `${filteredMembers.length} ${filteredMembers.length === 1 ? 'person' : 'people'}`
                  : `${members.length} ${members.length === 1 ? 'person' : 'people'}`
                }
              </p>
            </div>
          </div>

          <div className="space-y-7 mb-12">
            {filteredMembers.length === 0 && searchQuery ? (
              <div className="text-center py-12">
                <p className="text-lg" style={{ fontFamily: BODY, color: C.ink }}>No alumni found matching &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-sm mt-2" style={{ fontFamily: BODY, color: C.body }}>Try searching for a different name, location, profession, or interest</p>
              </div>
            ) : (
              <>
                {filteredMembers.map((member, index) => {
                  const palette = PALETTE[index % PALETTE.length];

                  return (
                    <div key={`member-${member.id}`}>
                      <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 44px -32px rgba(22,41,76,0.32)' }}>
                        <div style={{ height: '7px', background: palette.accent }} />
                        <div style={{ padding: '26px 28px 28px' }}>
                          {/* Photo floats beside the story, stacks above it on narrow
                              screens. When there's no photo, the story takes full width. */}
                          {member.photo?.url && (
                            <div className="k9-member-photo" style={{ position: 'relative' }}>
                              {/* overflow-hidden clips the photo to its rounded frame; the icon
                                  lives outside it so it can peek past the corner. */}
                              <div style={{ borderRadius: '18px', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(22,41,76,0.05)' }}>
                                {/* Shown in full at natural aspect — never cropped; long side
                                    capped via .k9-photo-img so portrait/landscape stay comparable. */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={member.photo.url} alt={member.photo.alt || `${member.name} profile photo`} className="k9-photo-img" />
                              </div>
                              {(() => {
                                const icon = photoIcon(member.id, index);
                                return icon ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={`/${icon}.png`} alt="" aria-hidden="true" className="nl-floaty" style={{ position: 'absolute', bottom: '-18px', left: '-18px', width: '64px', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(22,41,76,0.2))', zIndex: 2, pointerEvents: 'none' }} />
                                ) : null;
                              })()}
                            </div>
                          )}

                          {/* Name + badge + edit */}
                          <div className="flex items-center flex-wrap gap-3">
                            <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '30px', color: INK, margin: 0, lineHeight: 1.04 }}>
                              {member.name}
                            </h3>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={
                              member.currentlyLivingInHouse
                                ? { background: palette.soft, color: palette.deep }
                                : { background: '#E0E8F8', color: '#39539E' }
                            }>
                              {member.currentlyLivingInHouse ? 'Resident' : 'Alumni'}
                            </span>
                            <button
                              onClick={() => setEditRequestMember(member)}
                              className="px-2 py-1 text-gray-400 hover:text-[#E1564D] hover:bg-[#E1564D]/5 rounded transition-colors cursor-pointer flex items-center gap-1 text-sm"
                              title="Edit profile"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Edit
                            </button>
                          </div>

                          {/* Location with teardrop pin */}
                          {member.location && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '9px', fontSize: '15px', fontWeight: 800, color: palette.deep }}>
                              <span style={{ flex: 'none', width: '11px', height: '11px', borderRadius: '50% 50% 50% 0', transform: 'rotate(45deg)', background: palette.accent, boxShadow: `0 0 0 3px ${palette.soft}` }} />
                              <span>{member.location}</span>
                            </div>
                          )}

                          {/* In K9 period */}
                          {member.yearsInK9 && (
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#6b7890', marginTop: '7px' }}>
                              In K9: {member.yearsInK9}
                            </div>
                          )}

                          {/* Email */}
                          {member.email && (
                            <a
                              href={`mailto:${member.email}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '9px', fontSize: '14px', fontWeight: 700, color: palette.deep, textDecoration: 'none', wordBreak: 'break-all' }}
                            >
                              <Image src="/envelope.png" alt="" width={18} height={15} style={{ width: '18px', height: 'auto', flex: 'none' }} />
                              {member.email}
                            </a>
                          )}

                          {/* Story */}
                          {member.description && (
                            <div style={{ margin: '18px 0 0' }}>
                              {member.description.split('\n').filter(para => para.trim()).map((paragraph, idx) => (
                                <p key={idx} style={{ fontSize: '16px', lineHeight: 1.68, color: '#3a4a66', margin: idx === 0 ? 0 : '12px 0 0' }}>
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Signature */}
                          <div style={{ fontFamily: FONT_HAND, fontWeight: 700, fontSize: '30px', color: palette.deep, lineHeight: 1, marginTop: '14px' }}>
                            — {firstNameOf(member.name)}
                          </div>

                          <div style={{ clear: 'both' }} />

                          {/* What I do */}
                          {member.profession && (
                            <div style={{ marginTop: '16px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: palette.deep, marginBottom: '5px' }}>
                                What I do
                              </div>
                              <p style={{ fontSize: '15.5px', lineHeight: 1.62, color: '#3a4a66', margin: 0 }}>{member.profession}</p>
                            </div>
                          )}

                          {/* Interests */}
                          {member.interests.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: palette.deep, marginBottom: '8px' }}>
                                Interests
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {member.interests.map((interest, i) => (
                                  <span key={i} style={{ fontSize: '13.5px', fontWeight: 700, background: palette.soft, color: palette.deep, padding: '4px 12px', borderRadius: '999px' }}>
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Show call-to-action after 3rd entry only if there are 5+ members total */}
                      {index === 2 && filteredMembers.length >= 5 && (
                        <div className="mt-7">
                          <JoinCallToAction
                            onAddProfileClick={() => setIsFormOpen(true)}
                            isSubmitting={isSubmitting}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <JoinCallToAction 
            onAddProfileClick={() => setIsFormOpen(true)}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <ProfileForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddProfile}
      />

      {/* Edit Profile Modal */}
      <ProfileForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMember(null);
          setCurrentEditToken(undefined);
          window.history.replaceState({}, '', '/thek9family');
        }}
        onSubmit={handleEditProfile}
        initialData={editingMember ? {
          name: editingMember.name,
          email: editingMember.email,
          location: editingMember.location,
          profession: editingMember.profession,
          yearsInK9: editingMember.yearsInK9,
          description: editingMember.description,
          interests: editingMember.interests,
          photoUrl: editingMember.photo?.url,
          currentlyLivingInHouse: editingMember.currentlyLivingInHouse,
          birthday: editingMember.birthday,
          involvementLevel: editingMember.involvementLevel,
          otherInvolvementText: editingMember.otherInvolvementText
        } : undefined}
      />

      <BaseModal
        isOpen={editRequestMember !== null}
        onClose={() => {
          setEditRequestMember(null);
          setEditRequestStatus('idle');
          setEditRequestError(null);
        }}
        title="Edit Profile"
        maxWidth="sm"
      >
        <div className="space-y-4">
          {editRequestStatus === 'sent' ? (
            <>
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✉️</div>
                <p className="text-gray-700 font-medium">Email sent!</p>
                <p className="text-gray-600 text-sm mt-2">
                  We&apos;ve sent an email to <strong>{editRequestMember?.email}</strong> with instructions for editing the profile.
                </p>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => {
                    setEditRequestMember(null);
                    setEditRequestStatus('idle');
                  }}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </>
          ) : editRequestStatus === 'already_sent' ? (
            <>
              <div className="text-center py-4">
                <div className="text-4xl mb-3">📬</div>
                <p className="text-gray-700 font-medium">Check your inbox!</p>
                <p className="text-gray-600 text-sm mt-2">
                  We&apos;ve already sent an edit link to <strong>{editRequestMember?.email}</strong> in the last 24 hours.
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Please check your inbox (and spam folder) - that link is still valid!
                </p>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => {
                    setEditRequestMember(null);
                    setEditRequestStatus('idle');
                  }}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-700">
                To edit this profile, we&apos;ll send a verification email to{' '}
                <strong>{editRequestMember?.email}</strong>.
              </p>
              <p className="text-gray-600 text-sm">
                The email will contain instructions for making changes to the profile.
              </p>
              {editRequestError && (
                <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {editRequestError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setEditRequestMember(null);
                    setEditRequestStatus('idle');
                    setEditRequestError(null);
                  }}
                  className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editRequestMember) return;
                    setEditRequestStatus('sending');
                    setEditRequestError(null);
                    try {
                      const response = await fetch('/api/request-edit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          memberId: editRequestMember.id,
                          memberName: editRequestMember.name,
                          memberEmail: editRequestMember.email
                        })
                      });
                      const data = await response.json();
                      if (data.success) {
                        setEditRequestStatus('sent');
                      } else if (data.alreadySent) {
                        // Show friendly message for recently sent emails
                        setEditRequestStatus('already_sent');
                      } else {
                        setEditRequestError(data.error || 'Failed to send email');
                        setEditRequestStatus('idle');
                      }
                    } catch {
                      setEditRequestError('Failed to send email. Please try again.');
                      setEditRequestStatus('idle');
                    }
                  }}
                  disabled={editRequestStatus === 'sending'}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editRequestStatus === 'sending' ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </>
          )}
        </div>
      </BaseModal>
    </>
  );
}