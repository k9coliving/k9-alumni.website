import Layout from '@/components/Layout';

export default function HoldMyHair() {
  const supportCategories = [
    {
      title: "Emotional Support",
      icon: "💕",
      description: "Sometimes you just need someone to listen",
      color: "pink"
    },
    {
      title: "Practical Help",
      icon: "🛠️",
      description: "Need help with moving, logistics, or life admin?",
      color: "blue"
    },
    {
      title: "Professional Guidance",
      icon: "🎯",
      description: "Career advice, resume reviews, interview prep",
      color: "green"
    },
    {
      title: "Emergency Support",
      icon: "🚨",
      description: "Urgent situations where you need immediate help",
      color: "red"
    }
  ];

  const supportOffers = [
    {
      name: "Sarah Chen",
      location: "San Francisco, CA",
      specialties: ["Career transitions", "Tech industry", "Interview prep"],
      availability: "Weekends",
      responseTime: "< 4 hours"
    },
    {
      name: "Marcus Johnson",
      location: "New York, NY", 
      specialties: ["Moving logistics", "NYC apartment hunting", "Budgeting"],
      availability: "Evenings",
      responseTime: "< 2 hours"
    },
    {
      name: "Emma Rodriguez",
      location: "Austin, TX",
      specialties: ["Emotional support", "Relationship advice", "Life transitions"],
      availability: "Flexible",
      responseTime: "< 1 hour"
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      pink: "bg-pink-50 border-pink-200 hover:bg-pink-100",
      blue: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      green: "bg-green-50 border-green-200 hover:bg-green-100",
      red: "bg-red-50 border-red-200 hover:bg-red-100"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Hold My Hair 💕
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sometimes life gets overwhelming, and that&apos;s okay. Our community is here to support you 
              through the tough times, just like we did in K9. You&apos;re never alone.
            </p>
          </div>

          <div className="bg-gradient-to-r from-pink-100 to-purple-100 border border-pink-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <span className="text-3xl mr-4">🤗</span>
              <div>
                <h3 className="text-lg font-medium text-pink-900 mb-2">
                  Need immediate support?
                </h3>
                <p className="text-pink-800 mb-4">
                  If you&apos;re experiencing a crisis or emergency, please reach out to professional resources first. 
                  Our community support is here for ongoing care and everyday challenges.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="tel:988" className="text-pink-700 underline font-medium">
                    Crisis Text Line: Text HOME to 741741
                  </a>
                  <a href="tel:988" className="text-pink-700 underline font-medium">
                    National Suicide Prevention Lifeline: 988
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {supportCategories.map((category, index) => (
              <div key={index} className={`p-6 rounded-lg border-2 cursor-pointer transition-colors ${getColorClasses(category.color)}`}>
                <div className="text-center">
                  <span className="text-4xl mb-4 block">{category.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Request Support</h2>
              <p className="text-gray-600 mb-6">
                Reach out to our community when you need someone to hold your hair. 
                We&apos;re here for the big and small moments alike.
              </p>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What kind of support do you need?
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500">
                    <option>Select support type...</option>
                    <option>Emotional Support</option>
                    <option>Practical Help</option>
                    <option>Professional Guidance</option>
                    <option>Emergency Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tell us what&apos;s going on (optional)
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Share as much or as little as you&apos;re comfortable with..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred contact method
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500">
                    <option>Email</option>
                    <option>Phone call</option>
                    <option>Text message</option>
                    <option>Video call</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <label className="text-sm text-gray-600">
                    I&apos;m comfortable with being matched with multiple support volunteers
                  </label>
                </div>
                <button className="w-full bg-pink-600 text-white py-3 px-4 rounded-md hover:bg-pink-700 transition-colors font-medium">
                  Request Support
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Offer Support</h2>
              <p className="text-gray-600 mb-6">
                Be someone&apos;s hair-holder. Sign up to offer support to fellow alumni 
                who are going through challenging times.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-600">Flexible time commitment</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-600">Choose your areas of expertise</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-600">Set your own availability</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-600">Make a real difference in someone&apos;s life</span>
                </div>
              </div>
              <button className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium">
                Become a Support Volunteer
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-12">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Available Support Volunteers</h2>
              <p className="text-gray-600 mt-2">Alumni who are currently available to offer support</p>
            </div>
            <div className="divide-y divide-gray-200">
              {supportOffers.map((volunteer, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{volunteer.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">📍 {volunteer.location}</p>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Specializes in:</p>
                        <div className="flex flex-wrap gap-1">
                          {volunteer.specialties.map((specialty, specIndex) => (
                            <span key={specIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-4 text-sm text-gray-600">
                        <span>⏰ Available: {volunteer.availability}</span>
                        <span>⚡ Responds: {volunteer.responseTime}</span>
                      </div>
                    </div>
                    <button className="ml-4 bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors text-sm">
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Remember: You&apos;re Part of the K9 Family</h2>
            <p className="text-lg mb-6">
              No matter where life takes you, you always have a community that cares about you. 
              We&apos;ve got your back, just like you&apos;ve got ours.
            </p>
            <div className="space-x-4">
              <button className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                Join Support Community
              </button>
              <button className="border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-purple-600 transition-colors font-medium">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}