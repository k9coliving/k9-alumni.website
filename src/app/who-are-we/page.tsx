import Layout from '@/components/Layout';
import Image from 'next/image';

const teamMembers = [
  {
    name: "Abhi",
    role: "in house mole",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/abhi.jpg`
  },
  {
    name: "Mo", 
    role: "Newsletter whisperer",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/mo.jpg`
  },
  {
    name: "Jho",
    role: "Onboarding boss", 
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/jho.jpg`
  },
  {
    name: "Flow",
    role: "Map Master",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/flow.jpg`
  },
  {
    name: "Per",
    role: "Summit Guru",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/per.jpg`
  },
  {
    name: "Annelise", 
    role: "Chief Event Officer",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/annelise.jpg`
  },
  {
    name: "Camelia",
    role: "Tips & Offers Fairy", 
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/cami2.jpg`
  },
  {
    name: "You?",
    role: "Join our team!",
    image: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/who.png`
  }
];

export default function WhoAreWe() {
  return (
    <Layout>
      <div className="min-h-screen relative" style={{
        background: `
          radial-gradient(circle at 10px 10px, rgba(156, 163, 175, 0.15) 1px, transparent 1px)
        `,
        backgroundColor: '#f9fafb',
        backgroundSize: '20px 20px'
      }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-20">
            <h1 className="text-6xl sm:text-7xl font-extrabold text-gray-900 mb-4 tracking-tight" style={{ fontFamily: 'serif' }}>
              This is Us
            </h1>
            <div className="w-24 h-1 bg-amber-600 mx-auto rounded-full mb-8"></div>
            <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
              Meet the team behind the K9 Alumni Network
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-24 sm:gap-28 lg:gap-32 xl:gap-20 mb-16 justify-items-center xl:justify-center xl:max-w-none xl:mx-0 max-w-6xl mx-auto">
              {teamMembers.map((member, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center text-center opacity-0 animate-fadeInUp"
                  style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
                >
                <div className="relative mb-4 transition-all duration-300 hover:scale-105 cursor-pointer" style={{ width: '260px', height: '288px' }}>
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
                <p className="text-gray-600 text-sm">{member.role}</p>
                </div>
              ))}
          </div>

          <div className="max-w-4xl mx-auto px-4 mt-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-8">
              Why an alumni network?
            </h2>
            <div className="prose prose-lg sm:prose-xl max-w-none text-gray-700 leading-relaxed space-y-6">
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                We&apos;ve all called K9 home and been transformed by the incredible community and family we discovered there. 
                While we may no longer live within those walls, the connections we forged run far too deep to abandon.
              </p>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                What we built together—these relationships, this sense of belonging—is too precious to let slip away just because life takes us elsewhere.
              </p>
              <div className="text-center mt-12 mb-16">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-parisienne">
                  The K9 Alumni Network team
                </p>
                <p className="text-3xl">
                  ❤️ 🤗
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}