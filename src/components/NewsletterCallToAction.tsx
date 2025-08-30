interface NewsletterCallToActionProps {
  className?: string;
}

export default function NewsletterCallToAction({ className = "" }: NewsletterCallToActionProps) {
  return (
    <div className={`bg-gray-100 border border-gray-300 p-8 rounded-2xl shadow-lg max-w-3xl mx-auto ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
        Curious to read more?
      </h3>
      <div className="text-center space-y-4">
        <div className="space-y-1">
          <a
            href={process.env.NEXT_PUBLIC_NEWSLETTER_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary px-6 py-3 inline-block"
          >
            Share with us and join the next newsletter*
          </a>
          <div className="text-sm text-gray-500">*alumni and current residents welcome</div>
        </div>
        <div className="text-sm text-gray-600">
          or{' '}
          <a
            href={process.env.NEXT_PUBLIC_NEWSLETTER_LATEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Read the latest newsletter
          </a>
        </div>
      </div>
    </div>
  );
}