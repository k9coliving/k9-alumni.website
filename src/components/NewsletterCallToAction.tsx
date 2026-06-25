import Image from 'next/image';

interface NewsletterCallToActionProps {
  className?: string;
}

// Newsletter-aligned design tokens (shared with the landing + K9 Family pages).
const SERIF = 'var(--font-dm-serif), "DM Serif Display", serif';
const BODY = 'var(--font-nunito), "Nunito", system-ui, sans-serif';

export default function NewsletterCallToAction({ className = "" }: NewsletterCallToActionProps) {
  return (
    <div
      className={`p-8 rounded-[20px] flex flex-col sm:flex-row items-center justify-center gap-6 ${className}`}
      style={{ background: '#FBF7F1', border: '1px solid #ECE3D5', boxShadow: '0 1px 2px rgba(40,30,20,.03)' }}
    >
      <Image src="/dog-newspaper.png" alt="" width={160} height={160} className="nl-bob block flex-none h-32 w-auto order-1 sm:order-none" />
      <div className="text-center">
        <h3 className="text-3xl mb-3" style={{ fontFamily: SERIF, fontWeight: 400, color: '#1B2A41' }}>
          Curious to read more?
        </h3>
        <div className="space-y-1 mb-4">
          <a
            href={process.env.NEXT_PUBLIC_NEWSLETTER_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-7 py-3 rounded-full font-semibold text-white transition-colors hover:brightness-95"
            style={{ fontFamily: BODY, background: '#E1564D' }}
          >
            Share with us and join the next newsletter*
          </a>
          <div className="text-sm" style={{ fontFamily: BODY, color: '#6F695F' }}>*alumni and current residents welcome</div>
        </div>
        <div className="text-sm" style={{ fontFamily: BODY, color: '#6F695F' }}>
          or{' '}
          <a
            href={process.env.NEXT_PUBLIC_NEWSLETTER_LATEST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
            style={{ color: '#E1564D' }}
          >
            Read the latest newsletter
          </a>
        </div>
      </div>
    </div>
  );
}
