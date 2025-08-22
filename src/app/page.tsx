import Layout from '@/components/Layout';
import Image from 'next/image';

export default function Home() {
  return (
    <Layout>
      <div className="min-h-screen relative" style={{
        background: `
          radial-gradient(circle at 10px 10px, rgba(156, 163, 175, 0.15) 1px, transparent 1px)
        `,
        backgroundColor: '#f9fafb',
        backgroundSize: '20px 20px'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="page-header mb-12">
            <div className="flex justify-center mb-8">
              <Image 
                src="/k9-alumni-logo.png" 
                alt="K9 Alumni Network logo - connecting former K9 house residents" 
                width={120} 
                height={120}
                className="rounded-lg"
              />
            </div>
            <h1 className="page-header-title">
              Welcome to K9 Alumni
            </h1>
            <div className="page-header-divider"></div>
            <p className="page-header-subtitle">
              Whether you&apos;ve been a K9er for a few months or many years, moving out is never easy. 
              We are on a journey to build a strong alumni network, so the K9 magic lives on, 
              inside and outside the walls of the house.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <a href="/thek9family" className="block bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 p-8 rounded-3xl shadow-xl hover:shadow-2xl  transition-all transform hover:-translate-y-1 hover:scale-102">
              <div className="flex justify-center mb-6">
                <Image 
                  src="/alumni_db.png" 
                  alt="Database icon - search and connect with K9 alumni directory" 
                  width={120} 
                  height={120}
                  className="rounded-lg"
                />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-1">The K9 Family</h3>
              <p className="text-cyan-100 text-center text-sm">Introduce yourself and find other alumni</p>
            </a>
            
            <div className="block bg-gradient-to-br from-violet-400 to-purple-600 p-8 rounded-3xl shadow-xl relative">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
                Coming soon
              </div>
              <div className="flex justify-center mb-6">
                <Image 
                  src="/calendar.svg" 
                  alt="Calendar icon - discover upcoming K9 alumni events and gatherings" 
                  width={120} 
                  height={120}
                  className="rounded-lg opacity-75"
                />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-1">Upcoming Events</h3>
              <p className="text-violet-100 text-center text-sm">Share and discover alumni events</p>
            </div>
            
            <div className="block bg-gradient-to-br from-orange-400 to-red-500 pt-4 px-8 pb-8 rounded-3xl shadow-xl relative">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
                Coming soon
              </div>
              <div className="flex justify-center mb-2">
                <Image 
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/moving-no-bg.png`}
                  alt="Moving boxes illustration - relocation support and resources for K9 alumni" 
                  width={200} 
                  height={200}
                  className="rounded-lg opacity-75"
                />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-1">Relocation</h3>
              <p className="text-orange-100 text-center text-sm">Find alumni in your neighbourhood</p>
            </div>
            
            <div className="block bg-gradient-to-br from-amber-400 to-yellow-500 p-8 rounded-3xl shadow-xl relative">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
                Coming soon
              </div>
              <div className="flex justify-center mb-6">
                <Image 
                  src="/reading-side.svg" 
                  alt="Person reading illustration - stay updated with K9 alumni newsletter" 
                  width={120} 
                  height={120}
                  className="rounded-lg opacity-75"
                />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-1">Newsletter</h3>
              <p className="text-amber-100 text-center text-sm">Catch up and share life updates</p>
            </div>
            
            <div className="block bg-gradient-to-br from-blue-400 to-indigo-500 p-8 rounded-3xl shadow-xl relative">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
                Coming soon
              </div>
              <div className="flex justify-center mb-6">
                <Image 
                  src="/did-youknow.png" 
                  alt="Light bulb with question mark - discover helpful tips and offerings from fellow alumni" 
                  width={140} 
                  height={140}
                  className="rounded-lg opacity-75"
                />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-1">Tips & Offerings</h3>
              <p className="text-blue-100 text-center text-sm">Share what you can<br />Find what you need</p>
            </div>
            
            <div className="block bg-gradient-to-br from-pink-400 to-rose-500 p-8 rounded-3xl shadow-xl relative">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
                Coming soon
              </div>
              <div className="flex justify-center mb-6">
                <Image 
                  src="/help.png" 
                  alt="Helping hands icon - peer support and assistance within K9 alumni community" 
                  width={120} 
                  height={120}
                  className="rounded-lg opacity-75"
                />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-1">Hold my Hair</h3>
              <p className="text-pink-100 text-center text-sm">Tell us what you need</p>
            </div>
          </div>
          
          {/* Why we're here */}
          <div className="max-w-4xl mx-auto px-4 mt-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-8">
              Why we&apos;re here
            </h2>
            
            {/* Additional explanation */}
            <div className="prose prose-lg sm:prose-xl max-w-none text-gray-700 leading-relaxed space-y-6 mb-8">
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                The friendships and connections you&apos;ve built at K9 🏠 don&apos;t end when you move out. Here, you&apos;ll find familiar faces in new cities, continue the conversations 💬 that started over shared meals, and keep being part of each other&apos;s stories. From catching up over coffee ☕ when someone&apos;s in town, to sharing life updates and adventures - we&apos;re still the same community, just spread across different places 🌍.
              </p>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                If you&apos;re still a resident, no need to introduce yourself again 👋. <a href="/events" className="text-gray-800 underline decoration-gray-300 hover:text-violet-600 hover:decoration-violet-600 font-medium">Share events</a> 🎉 where alumni are welcome and join any existing events. Build new connections with alumni and make use of the <a href="/tips" className="text-gray-800 underline decoration-gray-300 hover:text-blue-600 hover:decoration-blue-600 font-medium">tips and resources</a> 💡 shared here. Tell us how life has been treating you via the <a href="/newsletter" className="text-gray-800 underline decoration-gray-300 hover:text-amber-600 hover:decoration-amber-600 font-medium">newsletter</a> 📝 and keep up with what alumni are up to. Don&apos;t hesitate to <a href="/holdmyhair" className="text-gray-800 underline decoration-gray-300 hover:text-pink-600 hover:decoration-pink-600 font-medium">ask for what you need</a> from the wider K9 family.
              </p>
            </div>
            
            <div className="bg-gray-100 border border-gray-300 p-8 rounded-2xl shadow-lg mb-12 max-w-3xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                We have three main goals:
              </h3>
              <div className="space-y-3 text-gray-800">
                <p className="text-lg leading-relaxed">💌  Stay in touch on and offline</p>
                <p className="text-lg leading-relaxed">🤗  Build relationships between alumni and current residents</p>
                <p className="text-lg leading-relaxed">🤲  Support each other emotionally, professionally and in any other way possible</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
