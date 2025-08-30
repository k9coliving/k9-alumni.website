'use client';

interface JoinCallToActionProps {
  onAddProfileClick: () => void;
  isSubmitting?: boolean;
}

export default function JoinCallToAction({ onAddProfileClick, isSubmitting = false }: JoinCallToActionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Excited about this?</h2>
      <p className="text-gray-600 mb-6">
        Join our alumni database to connect with fellow K9ers and help grow our community network.
      </p>
      <button 
        onClick={onAddProfileClick}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        disabled={isSubmitting}
      >
        Add Your Profile
      </button>
    </div>
  );
}