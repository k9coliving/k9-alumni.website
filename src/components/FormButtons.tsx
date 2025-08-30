interface FormButtonsProps {
  onCancel: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  cancelText?: string;
  submitType?: 'button' | 'submit';
}

export default function FormButtons({
  onCancel,
  onSubmit,
  isSubmitting = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  submitType = 'submit'
}: FormButtonsProps) {
  return (
    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        disabled={isSubmitting}
      >
        {cancelText}
      </button>
      <button
        type={submitType}
        onClick={submitType === 'button' ? onSubmit : undefined}
        disabled={isSubmitting}
        className="btn-primary px-6 py-2 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : submitText}
      </button>
    </div>
  );
}