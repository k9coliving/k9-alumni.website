import Layout from '@/components/Layout';

export default function Tips() {
  const tipCategories = [
    {
      title: "Housing & Living",
      icon: "🏠",
      color: "blue",
      tips: [
        {
          title: "Finding the Right Roommate",
          author: "Sarah Chen",
          date: "2 weeks ago",
          preview: "Living with the right people makes all the difference. Here&apos;s how I found amazing roommates after K9...",
          likes: 24,
          category: "Popular"
        },
        {
          title: "Apartment Hunting 101",
          author: "Marcus Johnson",
          date: "1 month ago",
          preview: "From security deposits to lease negotiations, here&apos;s everything I wish I knew before apartment hunting...",
          likes: 18,
          category: "Essential"
        }
      ]
    },
    {
      title: "Career & Professional",
      icon: "💼",
      color: "green",
      tips: [
        {
          title: "Networking After K9",
          author: "Emma Rodriguez",
          date: "3 days ago",
          preview: "How to leverage your K9 network for career opportunities and maintain professional relationships...",
          likes: 31,
          category: "Trending"
        },
        {
          title: "Negotiating Your First Salary",
          author: "David Kim",
          date: "1 week ago",
          preview: "Don&apos;t leave money on the table! Here&apos;s how I successfully negotiated my starting salary...",
          likes: 42,
          category: "Popular"
        }
      ]
    },
    {
      title: "Social & Relationships",
      icon: "🎉",
      color: "purple",
      tips: [
        {
          title: "Making Friends Outside K9",
          author: "Lisa Park",
          date: "5 days ago",
          preview: "Transitioning from K9&apos;s social environment to building new friendships can be challenging...",
          likes: 19,
          category: "New"
        },
        {
          title: "Dating After K9",
          author: "Alex Thompson",
          date: "2 weeks ago",
          preview: "Navigating the dating world when you&apos;re used to K9&apos;s unique social dynamics...",
          likes: 27,
          category: "Popular"
        }
      ]
    }
  ];

  const featuredTips = [
    {
      title: "The Ultimate Guide to Post-K9 Life",
      author: "Alumni Committee",
      readTime: "15 min read",
      description: "A comprehensive guide covering everything from housing to career to maintaining friendships after leaving K9.",
      tags: ["Essential", "Comprehensive", "Housing", "Career"],
      featured: true
    },
    {
      title: "Building Your Professional Network",
      author: "Sarah Chen",
      readTime: "8 min read",
      description: "Practical strategies for expanding your professional network beyond the K9 community.",
      tags: ["Career", "Networking", "Professional"],
      featured: true
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      green: "bg-green-50 border-green-200 text-green-800", 
      purple: "bg-purple-50 border-purple-200 text-purple-800"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Alumni Tips & Advice
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn from the experiences of fellow K9 alumni. Get practical advice 
              on navigating life after K9, from housing to career to relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {featuredTips.map((tip, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-400">
                <div className="flex items-center mb-3">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Featured
                  </span>
                  <span className="ml-2 text-sm text-gray-500">{tip.readTime}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-gray-600 mb-4">{tip.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tip.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">By {tip.author}</span>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Read More →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {tipCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`p-4 ${getColorClasses(category.color)}`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{category.icon}</span>
                    <h2 className="text-lg font-bold">{category.title}</h2>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {category.tips.map((tip, tipIndex) => (
                    <div key={tipIndex} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          tip.category === 'Popular' ? 'bg-red-100 text-red-800' :
                          tip.category === 'Trending' ? 'bg-orange-100 text-orange-800' :
                          tip.category === 'Essential' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {tip.category}
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="mr-1">❤️</span>
                          {tip.likes}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{tip.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{tip.preview}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>By {tip.author}</span>
                        <span>{tip.date}</span>
                      </div>
                    </div>
                  ))}
                  <button className="w-full text-center py-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View All {category.title} Tips
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Share Your Tip</h2>
              <p className="text-gray-600 mb-4">
                Have valuable advice for fellow alumni? Share your experiences and help others 
                navigate their post-K9 journey.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  Help fellow alumni with your experience
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  Build your reputation in the community
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  Connect with alumni facing similar challenges
                </div>
              </div>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                Submit a Tip
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Request Advice</h2>
              <p className="text-gray-600 mb-4">
                Facing a specific challenge? Ask the community for advice and get personalized 
                tips from alumni who&apos;ve been there.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">❓</span>
                  Get personalized advice for your situation
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">❓</span>
                  Connect with alumni who&apos;ve faced similar challenges
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">❓</span>
                  Receive multiple perspectives and solutions
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                Ask for Advice
              </button>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse All Tips</h2>
            <p className="text-gray-600 mb-6">
              Explore our complete collection of alumni tips and advice across all categories.
            </p>
            <button className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium">
              View All Tips
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}