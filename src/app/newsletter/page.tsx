import Layout from '@/components/Layout';

export default function Newsletter() {
  const recentIssues = [
    {
      title: "Summer Alumni Updates",
      date: "July 2024",
      preview: "Catch up on summer events, new alumni spotlights, and upcoming gatherings across the country...",
      topics: ["Events", "Alumni Spotlights", "Summer Gatherings"]
    },
    {
      title: "Career Moves & Celebrations",
      date: "June 2024",
      preview: "Celebrating recent promotions, job changes, and professional achievements in our community...",
      topics: ["Career Updates", "Achievements", "Professional Network"]
    },
    {
      title: "Relocation Wave",
      date: "May 2024",
      preview: "So many alumni are on the move! Find out who&apos;s relocating where and how to connect...",
      topics: ["Relocations", "City Updates", "Housing"]
    }
  ];

  const newsletterFeatures = [
    {
      icon: "📰",
      title: "Alumni Spotlights",
      description: "Get to know fellow alumni through featured profiles and their post-K9 journeys"
    },
    {
      icon: "🎉",
      title: "Event Updates",
      description: "Stay informed about upcoming gatherings, reunions, and local meetups"
    },
    {
      icon: "💼",
      title: "Career News",
      description: "Celebrate promotions, job changes, and professional achievements"
    },
    {
      icon: "🏠",
      title: "Housing Board",
      description: "Latest housing opportunities, roommate searches, and relocation updates"
    },
    {
      icon: "💡",
      title: "Tips & Advice",
      description: "Featured tips from alumni and practical advice for post-K9 life"
    },
    {
      icon: "📅",
      title: "Community Calendar",
      description: "Important dates, deadlines, and opportunities you won&apos;t want to miss"
    }
  ];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              K9 Alumni Newsletter
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay connected with the K9 community through our monthly newsletter. 
              Get updates on alumni, events, and opportunities delivered to your inbox.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg mb-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Subscribe to Stay Connected</h2>
              <p className="text-lg mb-6">
                Join over 200 alumni who receive our monthly updates and never miss what&apos;s happening in the community.
              </p>
              <div className="max-w-md mx-auto">
                <div className="flex">
                  <input 
                    type="email"
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button className="bg-white text-blue-600 px-6 py-3 rounded-r-lg hover:bg-gray-100 transition-colors font-medium">
                    Subscribe
                  </button>
                </div>
                <p className="text-sm mt-2 text-blue-100">
                  Unsubscribe anytime. We respect your privacy.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What&apos;s Inside Each Issue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsletterFeatures.map((feature, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-center">
                    <span className="text-3xl mb-3 block">{feature.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Issues</h2>
            <div className="space-y-6">
              {recentIssues.map((issue, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{issue.title}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{issue.date}</span>
                  </div>
                  <p className="text-gray-600 mb-4">{issue.preview}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {issue.topics.map((topic, topicIndex) => (
                      <span key={topicIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Read Full Issue →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contribute to the Newsletter</h2>
              <p className="text-gray-600 mb-4">
                Have news to share? Want to be featured? We&apos;d love to hear from you and include 
                your updates in our next issue.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span className="text-sm text-gray-600">Share your career updates and achievements</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span className="text-sm text-gray-600">Submit tips and advice for fellow alumni</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span className="text-sm text-gray-600">Announce events or gatherings you&apos;re organizing</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span className="text-sm text-gray-600">Share housing opportunities or roommate searches</span>
                </div>
              </div>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                Submit Content
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Newsletter Archive</h2>
              <p className="text-gray-600 mb-4">
                Browse through past issues to catch up on community news and see how our 
                alumni network has grown over time.
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-700">July 2024 - Summer Updates</span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">View</button>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-700">June 2024 - Career Moves</span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">View</button>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-700">May 2024 - Relocation Wave</span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">View</button>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-700">April 2024 - Spring Reunion</span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">View</button>
                </div>
              </div>
              <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors">
                Browse All Issues
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <span className="text-2xl mb-4 block">📬</span>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Never Miss an Update</h2>
            <p className="text-gray-600 mb-6">
              Our newsletter is the best way to stay connected with the K9 alumni community. 
              Subscribe today and be part of the ongoing story.
            </p>
            <button className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium">
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}