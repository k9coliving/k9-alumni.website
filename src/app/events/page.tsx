import Layout from '@/components/Layout';

export default function Events() {
  const upcomingEvents = [
    {
      id: 1,
      title: "K9 Alumni Summer BBQ",
      date: "August 15, 2024",
      time: "6:00 PM - 10:00 PM",
      location: "Golden Gate Park, San Francisco",
      description: "Join us for our annual summer gathering! Food, drinks, and great company.",
      attendees: 23,
      isVirtual: false
    },
    {
      id: 2,
      title: "Virtual Coffee Chat",
      date: "August 22, 2024",
      time: "7:00 PM - 8:00 PM",
      location: "Zoom",
      description: "Monthly virtual meetup for alumni around the world.",
      attendees: 15,
      isVirtual: true
    },
    {
      id: 3,
      title: "K9 Alumni NYC Meetup",
      date: "September 5, 2024",
      time: "7:30 PM - 10:00 PM",
      location: "Brooklyn Bridge Park",
      description: "East Coast alumni gathering with stunning city views.",
      attendees: 18,
      isVirtual: false
    }
  ];

  const pastEvents = [
    {
      title: "Spring Reunion 2024",
      date: "April 20, 2024",
      attendees: 45,
      photos: 127
    },
    {
      title: "Winter Holiday Party",
      date: "December 16, 2023",
      attendees: 38,
      photos: 89
    }
  ];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Events & Gatherings
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay connected with fellow K9 alumni through our regular events, 
              meetups, and special gatherings around the world.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.isVirtual 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {event.isVirtual ? 'Virtual' : 'In-Person'}
                      </span>
                      <span className="text-sm text-gray-500">{event.attendees} attending</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📅</span>
                        {event.date}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">⏰</span>
                        {event.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📍</span>
                        {event.location}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                    
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium">
                      RSVP Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Event Types</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🍕</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Social Meetups</h3>
                    <p className="text-sm text-gray-600">Casual gatherings for food, drinks, and catching up</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">💻</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Virtual Coffee Chats</h3>
                    <p className="text-sm text-gray-600">Online meetups for distant alumni to stay connected</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🎉</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Special Celebrations</h3>
                    <p className="text-sm text-gray-600">Annual reunions, holiday parties, and milestone events</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🚀</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Professional Networking</h3>
                    <p className="text-sm text-gray-600">Career-focused events and industry meetups</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Want to Host an Event?</h2>
              <p className="text-gray-600 mb-4">
                Interested in organizing a local meetup or special event? We&apos;d love to help you bring 
                alumni together in your area!
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  We&apos;ll help promote your event
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  Connect you with local alumni
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  Provide event planning resources
                </div>
              </div>
              <button className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium">
                Propose an Event
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastEvents.map((event, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{event.date}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{event.attendees} attendees</span>
                    <span>{event.photos} photos</span>
                  </div>
                  <button className="w-full mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View Photos & Memories
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}