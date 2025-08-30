import Image from 'next/image';

interface Tip {
  id: string;
  submitter_name: string;
  title: string;
  description: string;
  external_link?: string;
  image_url?: string;
  image_alt?: string;
  is_hold_my_hair: boolean;
  created_at: string;
}

interface TipCardProps {
  tip: Tip;
}

export default function TipCard({ tip }: TipCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="flex items-start gap-6">
      {/* Tip Image */}
      <div className="flex-shrink-0">
        <div className="w-48 bg-gray-100 flex items-center justify-center rounded-lg shadow-lg">
          {tip.image_url ? (
            <Image
              src={tip.image_url}
              alt={tip.image_alt || `Image for ${tip.title}`}
              width={192}
              height={192}
              className="w-48 h-auto object-contain rounded-lg"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-50 flex items-center justify-center rounded-lg">
              <Image
                src={`/missing/${(() => {
                  const placeholderImages = [
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
                  ];
                  // Use tip ID to deterministically choose an image
                  const index = parseInt(tip.id.slice(-1), 16) % placeholderImages.length;
                  return placeholderImages[index];
                })()}`}
                alt="Tip placeholder illustration"
                width={96}
                height={96}
                className="w-24 h-24"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tip Details */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="text-xl font-semibold text-gray-900">{tip.title}</h4>
            <p className="text-sm text-gray-500">{formatDate(tip.created_at)}</p>
          </div>
        </div>
        
        {/* Hold My Hair Badge */}
        {tip.is_hold_my_hair && (
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">🔥</span>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Hold My Hair
            </span>
          </div>
        )}
        
        {/* Description */}
        <div>
          <p className="text-gray-600 leading-relaxed">{tip.description}</p>
        </div>
        
        {/* External Link */}
        {tip.external_link && (
          <div>
            <a
              href={tip.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-gray-900 hover:underline font-medium"
            >
              {(() => {
                const link = tip.external_link;
                // Handle mailto links
                if (link.startsWith('mailto:')) {
                  const email = link.substring(7); // Remove 'mailto:' prefix
                  return email.length > 50 ? email.substring(0, 50) + '...' : email;
                }
                // Handle regular URLs
                return link.length > 50 ? link.substring(0, 50) + '...' : link;
              })()}
            </a>
          </div>
        )}
        
        {/* Signature */}
        <div className="flex justify-end mt-6">
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 font-parisienne tracking-wide" style={{ wordSpacing: '0.25em' }}>— {tip.submitter_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}