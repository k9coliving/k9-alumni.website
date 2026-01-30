'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProfileForm, { type ProfileFormData } from '@/components/ProfileForm';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  hasUuid: boolean;
  actualName?: string;
}

interface TeamMembersClientProps {
  teamMembers: TeamMember[];
}

export default function TeamMembersClient({ teamMembers }: TeamMembersClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const router = useRouter();

  const handleJoinTeamClick = () => {
    setIsFormOpen(true);
  };

  const handleTeamMemberClick = (member: TeamMember) => {
    if (member.hasUuid && member.actualName) {
      // Navigate to K9 Family page with name filter
      router.push(`/thek9family?search=${encodeURIComponent(member.actualName)}`);
    }
  };

  const handleAddProfile = async (formData: ProfileFormData) => {
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
          photo_url: formData.photoUrl,
          involvement_level: formData.involvementLevel,
          other_involvement_text: formData.otherInvolvementText,
          birthday: formData.birthday,
          currently_living_in_house: formData.currentlyLivingInHouse
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add profile');
      }

      setIsFormOpen(false);
      alert('Welcome to the Alumni Network Team! Your profile has been added.');
    } catch (error) {
      console.error('Error adding profile:', error);
      alert('Error adding profile. Please try again.');
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-24 sm:gap-28 lg:gap-32 xl:gap-20 mb-16 justify-items-center xl:justify-center xl:max-w-none xl:mx-0 max-w-6xl mx-auto">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center opacity-0 animate-fadeInUp"
            style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
          >
            <div
              className={`relative mb-4 transition-all duration-300 hover:scale-105 ${
                member.name === 'You?' || member.hasUuid ? 'cursor-pointer' : 'cursor-default'
              }`}
              style={{ width: '260px', height: '288px' }}
              onClick={() => {
                if (member.name === 'You?') {
                  handleJoinTeamClick();
                } else {
                  handleTeamMemberClick(member);
                }
              }}
            >
              <Image
                src={member.image}
                alt={`Portrait photo of ${member.name}, ${member.role} for the K9 Alumni team`}
                width={120}
                height={160}
                className="object-cover rounded-lg"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120px',
                  height: '160px',
                  zIndex: 1,
                  filter: member.name === 'Mo' ? 'none' : member.name === 'You?' ? 'sepia(25%) saturate(60%) contrast(75%) brightness(95%) hue-rotate(15deg) opacity(75%)' : 'sepia(15%) saturate(80%) contrast(90%) brightness(105%) hue-rotate(10deg)'
                }}
              />
              <Image
                src="/frame.png"
                alt="Decorative ornate gold vintage picture frame"
                width={260}
                height={288}
                className="w-full h-full"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2,
                  objectFit: 'fill'
                }}
              />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1 font-parisienne">
              {member.name}
            </h3>
            <p
              className={`text-sm ${
                member.name === 'You?'
                  ? 'text-blue-600 hover:text-blue-800 cursor-pointer hover:underline transition-colors'
                  : member.hasUuid
                    ? 'text-gray-600 cursor-pointer hover:text-blue-600 transition-colors'
                    : 'text-gray-600'
              }`}
              onClick={() => {
                if (member.name === 'You?') {
                  handleJoinTeamClick();
                } else {
                  handleTeamMemberClick(member);
                }
              }}
            >
              {member.role}
            </p>
          </div>
        ))}
      </div>

      {/* Add Profile Form Modal */}
      <ProfileForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddProfile}
        prefilledInvolvement="Alumni Network Team"
      />
    </>
  );
}