import Layout from '@/components/Layout';

export default function Relocation() {
  const popularCities = [
    { city: "San Francisco", state: "CA", alumni: 45, avgRent: "$3,200" },
    { city: "New York", state: "NY", alumni: 38, avgRent: "$2,800" },
    { city: "Los Angeles", state: "CA", alumni: 29, avgRent: "$2,400" },
    { city: "Seattle", state: "WA", alumni: 22, avgRent: "$2,100" },
    { city: "Chicago", state: "IL", alumni: 18, avgRent: "$1,800" },
    { city: "Austin", state: "TX", alumni: 15, avgRent: "$1,600" }
  ];

  const relocationTips = [
    {
      category: "Housing",
      icon: "🏠",
      tips: [
        "Connect with local alumni for roommate opportunities",
        "Check K9 alumni housing board for available rooms",
        "Get recommendations for safe neighborhoods",
        "Coordinate move-in dates with other alumni"
      ]
    },
    {
      category: "Professional",
      icon: "💼",
      tips: [
        "Leverage alumni network for job referrals",
        "Attend local professional meetups",
        "Update your LinkedIn with K9 alumni connections",
        "Join industry-specific alumni groups"
      ]
    },
    {
      category: "Social",
      icon: "🎉",
      tips: [
        "Join local K9 alumni WhatsApp groups",
        "Attend city-specific alumni events",
        "Organize welcome dinners for new arrivals",
        "Share local recommendations and tips"
      ]
    }
  ];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Relocation Support
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Moving to a new city? Connect with K9 alumni in your destination 
              and get the support you need for a smooth transition.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <span className="text-2xl mr-3">🗺️</span>
              <div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Find Alumni in Your New City
                </h3>
                <p className="text-blue-800 mb-4">
                  Use our alumni database to connect with K9ers in your destination city. 
                  Many are happy to help with housing, job tips, and local recommendations.
                </p>
                <a 
                  href="/database" 
                  className="inline-block btn-primary px-4 py-2"
                >
                  Search Alumni Database
                </a>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Alumni Cities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularCities.map((city, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{city.city}, {city.state}</h3>
                      <p className="text-sm text-gray-600">{city.alumni} alumni</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      Avg rent: {city.avgRent}
                    </span>
                  </div>
                  <button className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-200 hover:border-blue-300 py-2 rounded-md transition-colors">
                    Connect with Local Alumni
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {relocationTips.map((category, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">{category.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{category.category} Tips</h3>
                </div>
                <ul className="space-y-2">
                  {category.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start text-sm text-gray-600">
                      <span className="text-green-500 mr-2 mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Housing Board</h2>
              <p className="text-gray-600 mb-4">
                Check our dedicated housing board where alumni post available rooms, 
                seek roommates, and share housing opportunities.
              </p>
              <div className="space-y-3 mb-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm font-medium text-gray-900">Room Available - SF Mission</p>
                  <p className="text-xs text-gray-600">Posted 2 days ago • $1,200/month</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm font-medium text-gray-900">Seeking Roommate - NYC Brooklyn</p>
                  <p className="text-xs text-gray-600">Posted 5 days ago • $1,400/month</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm font-medium text-gray-900">Sublet Available - LA West Hollywood</p>
                  <p className="text-xs text-gray-600">Posted 1 week ago • $1,800/month</p>
                </div>
              </div>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                View All Housing Posts
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">City Guides</h2>
              <p className="text-gray-600 mb-4">
                Comprehensive guides created by alumni for popular destination cities, 
                including neighborhoods, transportation, and local favorites.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">San Francisco Guide</span>
                  <span className="text-sm text-gray-600">Updated 1 week ago</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">New York City Guide</span>
                  <span className="text-sm text-gray-600">Updated 2 weeks ago</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Los Angeles Guide</span>
                  <span className="text-sm text-gray-600">Updated 3 weeks ago</span>
                </div>
              </div>
              <button className="btn-primary w-full py-2 px-4">
                Browse All Guides
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Moving Soon?</h2>
            <p className="text-lg mb-6">
              Let us know about your relocation plans so we can connect you with local alumni 
              and help make your transition smoother.
            </p>
            <div className="space-x-4">
              <button className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                Register Your Move
              </button>
              <button className="border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-green-600 transition-colors font-medium">
                Offer to Help Others
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}