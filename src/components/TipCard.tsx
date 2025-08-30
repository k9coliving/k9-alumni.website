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
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Image */}
      {tip.image_url && (
        <div className="h-48 w-full relative">
          <Image
            src={tip.image_url}
            alt={tip.image_alt || `Image for ${tip.title}`}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {/* Hold My Hair Badge */}
        {tip.is_hold_my_hair && (
          <div className="inline-block mb-3">
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Hold My Hair
            </span>
          </div>
        )}
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          {tip.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-700 mb-4 leading-relaxed">
          {tip.description}
        </p>
        
        {/* External Link */}
        {tip.external_link && (
          <div className="mb-4">
            <a
              href={tip.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              🔗 Learn more
              <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4 mt-4">
          <span className="font-medium">by {tip.submitter_name}</span>
          <span>{formatDate(tip.created_at)}</span>
        </div>
      </div>
    </div>
  );
}