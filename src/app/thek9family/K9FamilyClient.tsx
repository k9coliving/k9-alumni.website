'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AddProfileForm from '@/components/AddProfileForm';

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

export default function K9FamilyClient({ initialMembers, filterOptions }: K9FamilyClientProps) {
  const [members, setMembers] = useState<AlumniMember[]>(initialMembers);
  const [filteredMembers, setFilteredMembers] = useState<AlumniMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                <p className="text-gray-500 text-lg">No alumni found matching "{searchQuery}"</p>
                <p className="text-gray-400 text-sm mt-2">Try searching for a different name, location, profession, or interest</p>
              </div>
            ) : (
              filteredMembers.map((member, index) => {
              const isEven = index % 2 === 0;
              
              return (
                <div key={member.id} className={`flex items-start gap-12 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
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
              );
            }))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Excited about this?</h2>
            <p className="text-gray-600 mb-6">
              Join our alumni database to connect with fellow K9ers and help grow our community network.
            </p>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Add Your Profile
            </button>
          </div>
        </div>
      </div>

      <AddProfileForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddProfile}
      />
    </>
  );
}