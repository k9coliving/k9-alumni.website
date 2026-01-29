'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import AddProfileForm from '@/components/AddProfileForm';
import JoinCallToAction from '@/components/JoinCallToAction';
import BaseModal from '@/components/BaseModal';

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
}

interface FilterOptions {
  cities: string[];
  interests: string[];
  periods: string[];
}

interface FormData {
  name: string;
  email: string;
  location: string;
  profession: string;
  yearsInK9: string;
  description: string;
  interests: string[];
  photoUrl: string;
  involvementLevel: string;
  otherInvolvementText: string;
  birthday: Date | null;
  currentlyLivingInHouse: boolean;
}

interface K9FamilyClientProps {
  initialMembers: AlumniMember[];
  filterOptions: FilterOptions;
}

export default function K9FamilyClient({ initialMembers }: K9FamilyClientProps) {
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<AlumniMember[]>(initialMembers);
  const [filteredMembers, setFilteredMembers] = useState<AlumniMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editRequestMember, setEditRequestMember] = useState<AlumniMember | null>(null);
  const [editRequestStatus, setEditRequestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [editRequestError, setEditRequestError] = useState<string | null>(null);

  // Initialize search query from URL parameter
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

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

  const handleAddProfile = async (formData: FormData) => {
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
      
    } catch (error) {
      console.error('Error adding profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to add profile. Please try again.');
      throw error; // Re-throw so the form knows there was an error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen relative" style={{
        background: `
          radial-gradient(circle at 10px 10px, rgba(156, 163, 175, 0.15) 1px, transparent 1px)
        `,
        backgroundColor: '#f9fafb',
        backgroundSize: '20px 20px'
      }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="page-header !mb-4">
            <h1 className="page-header-title">
              The K9 Family
            </h1>
            <div className="page-header-divider"></div>
            <p className="page-header-subtitle">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 text-lg bg-white shadow-sm"
            />
            <div className="text-center mt-2 mb-16">
              <p className="text-gray-500 text-sm">
                {searchQuery 
                  ? `${filteredMembers.length} ${filteredMembers.length === 1 ? 'person' : 'people'}` 
                  : `${members.length} ${members.length === 1 ? 'person' : 'people'}`
                }
              </p>
            </div>
          </div>

          <div className="space-y-16 mb-12">
            {filteredMembers.length === 0 && searchQuery ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No alumni found matching &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-gray-400 text-sm mt-2">Try searching for a different name, location, profession, or interest</p>
              </div>
            ) : (
              <>
                {filteredMembers.map((member, index) => {
                  const isEven = index % 2 === 0;
                  
                  return (
                    <div key={`member-${member.id}`}>
                      <div className={`flex items-start gap-12 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    <div className="w-80 bg-gray-100 flex items-center justify-center rounded-lg shadow-lg">
                      {member.photo?.url ? (
                        <Image
                          src={member.photo.url}
                          alt={member.photo.alt || `${member.name} profile photo`}
                          width={320}
                          height={320}
                          className="w-80 h-auto object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-80 h-80 bg-gray-50 flex items-center justify-center rounded-lg">
                          <Image
                            src={`/missing/${member.placeholderImage || 'cat.svg'}`}
                            alt="Profile placeholder illustration"
                            width={256}
                            height={256}
                            className="w-64 h-64"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Content */}
                  <div className="flex-1 space-y-6">
                    <div className="space-y-1">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-3xl font-bold text-gray-900 font-parisienne tracking-wide" style={{ wordSpacing: '0.25em' }}>{member.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.currentlyLivingInHouse
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {member.currentlyLivingInHouse ? 'Resident' : 'Alumni'}
                          </span>
                          <button
                            onClick={() => setEditRequestMember(member)}
                            className="mx-3 px-2 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer flex items-center gap-1 text-sm"
                            title="Edit profile"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit
                          </button>
                        </div>
                        <p className="text-lg text-gray-600 font-medium">At K9: {member.yearsInK9}</p>
                      </div>
                      
                      {member.location && (
                        <div className="flex items-center text-gray-600">
                          <span className="mr-3 text-lg">🌍</span>
                          <span className="text-lg">{member.location}</span>
                        </div>
                      )}
                    </div>

                    {member.description && (
                      <div>
                        <p className="text-gray-700 text-lg leading-relaxed">
                          {member.description}
                        </p>
                      </div>
                    )}

                    {member.profession && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">What I do:</p>
                        <p className="text-gray-600 text-lg">
                          {member.profession}
                        </p>
                      </div>
                    )}

                    {member.interests.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Interests:</p>
                        <div className="flex flex-wrap gap-2">
                          {member.interests.map((interest, index) => (
                            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {member.email && (
                      <div>
                        <a 
                          href={`mailto:${member.email}`}
                          className="inline-flex items-center gap-2 text-xl font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 px-3 py-1 rounded-md border border-gray-300 hover:border-gray-400 font-parisienne"
                        >
                          <span>🎈</span>
                          {member.email}
                        </a>
                      </div>
                      )}
                    </div>
                  </div>
                      
                      {/* Show call-to-action after 3rd entry only if there are 5+ members total */}
                      {index === 2 && filteredMembers.length >= 5 && (
                        <div className="mt-16">
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

      <AddProfileForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddProfile}
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