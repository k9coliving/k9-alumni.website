'use client';

import { useState } from 'react';
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
}

interface K9FamilyClientProps {
  initialMembers: AlumniMember[];
  filterOptions: FilterOptions;
}

export default function K9FamilyClient({ initialMembers, filterOptions }: K9FamilyClientProps) {
  const [members, setMembers] = useState<AlumniMember[]>(initialMembers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          photo_url: formData.photoUrl || null
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
        } : undefined
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
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              The K9 Family
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with fellow K9 alumni around the world. Find roommates, get life advice, 
              or simply catch up with old friends.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter Alumni</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by name</label>
                <input 
                  type="text" 
                  placeholder="Enter name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All cities</option>
                  {filterOptions.cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All interests</option>
                  {filterOptions.interests.map(interest => (
                    <option key={interest} value={interest}>{interest}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">K9 Period</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All periods</option>
                  {filterOptions.periods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Search
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-600">Showing {members.length} alumni</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Grid View
              </button>
              <button className="px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md">
                List View
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {members.map((member) => (
              <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {member.photo?.url ? (
                    <Image
                      src={member.photo.url}
                      alt={member.photo.alt || `${member.name} profile photo`}
                      width={400}
                      height={256}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                      <Image
                        src={`/missing/${[
                          'Animals with Balloons.svg',
                          'Cat Astronaut Illustration.svg', 
                          'Cat Pumpkin Illustration.svg',
                          'Cat Throwing Vase.svg',
                          'Chicken Eating a Worm.svg',
                          'Cute Chicken Illustration.svg',
                          'Diving with Animals.svg',
                          'Dog Paw Illustration.svg',
                          'Kiwi Bird Illustration.svg',
                          'Octopus Vector Illustration.svg',
                          'Penguin Family Illustration.svg',
                          'Playful Cat Illustration.svg',
                          'cat.svg'
                        ][Math.floor(Math.random() * 13)]}`}
                        alt="Profile placeholder illustration"
                        width={192}
                        height={192}
                        className="w-48 h-48"
                      />
                    </div>
                  )}
                </div>

                <div className="px-6 py-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-sm text-gray-600">K9 {member.yearsInK9}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📍</span>
                      {member.location}
                    </div>
                    <div className="flex items-start text-sm text-gray-600">
                      <span className="mr-2 mt-0.5">💼</span>
                      <span className="line-clamp-2">{member.profession}</span>
                    </div>
                  </div>

                  {member.interests.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Interests:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.interests.slice(0, 6).map((interest, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {interest}
                          </span>
                        ))}
                        {member.interests.length > 6 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                            +{member.interests.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {member.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {member.description}
                      </p>
                    </div>
                  )}

                  {member.email && (
                    <a 
                      href={`mailto:${member.email}`}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors block text-center"
                    >
                      Connect
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Not Listed Yet?</h2>
            <p className="text-gray-600 mb-6">
              Join our alumni database to connect with fellow K9ers and help grow our community network.
            </p>
            <div className="space-x-4">
              <button 
                onClick={() => setIsFormOpen(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Add Your Profile
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Update Existing Profile
              </button>
            </div>
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