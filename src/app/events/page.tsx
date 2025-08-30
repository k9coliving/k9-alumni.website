'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/Layout';
import CustomEventForm from '@/components/CustomEventForm';

interface ResidentData {
  id: string;
  name: string;
  birthday: string;
  location?: string;
  profession?: string;
  email?: string;
  years_in_k9?: string;
  photo_url?: string;
  photo_alt?: string;
  interests?: string[];
  preferences?: {
    placeholder_image?: string;
  };
}

interface BirthdayEvent {
  id: string;
  name: string;
  birthday: string;
  location?: string;
  profession?: string;
  email?: string;
  yearsInK9?: string;
  photo?: {
    url: string;
    alt: string;
  };
  placeholderImage?: string;
  birthdayThisYear?: Date;
  interests?: string[];
}

interface CustomEvent {
  id: string;
  organizer_name: string;
  organizer_email: string;
  title: string;
  description: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  duration?: string;
  info_link?: string;
  visual_url?: string;
  additional_notes?: string;
  created_at: string;
}

interface CustomEventFormData {
  organizerName: string;
  organizerEmail: string;
  eventTitle: string;
  eventDescription: string;
  eventLocation: string;
  startDateTime: string;
  duration: string;
  infoLink: string;
  visualUrl: string;
  visualFile: File | null;
  additionalNotes: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location?: string;
  type: 'birthday' | 'custom';
  birthdayEvent?: BirthdayEvent;
  customEvent?: CustomEvent;
  eventDate: Date;
}

export default function Events() {
  const [allBirthdays, setAllBirthdays] = useState<BirthdayEvent[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredEventDate, setHoveredEventDate] = useState<string | null>(null);
  const [selectedEventDate, setSelectedEventDate] = useState<string | null>(null);
  const [isCustomEventFormOpen, setIsCustomEventFormOpen] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      try {
        // Fetch residents and custom events in parallel
        const [residentsResponse, customEventsResponse] = await Promise.all([
          fetch('/api/residents'),
          fetch('/api/custom-events')
        ]);
        
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        let birthdayEvents: BirthdayEvent[] = [];
        let fetchedCustomEvents: CustomEvent[] = [];
        
        // Process residents/birthdays
        if (residentsResponse.ok) {
          const residents: ResidentData[] = await residentsResponse.json();
          
          // Filter residents with birthdays and convert to events
          birthdayEvents = residents
            .filter((resident) => resident.birthday)
            .flatMap((resident) => {
              // Extract month and day from birthday (ignore the stored year - birthdays repeat annually)
              const birthday = new Date(resident.birthday);
              const birthdayMonth = birthday.getMonth(); // 0-indexed
              const birthdayDay = birthday.getDate();
              
              const events = [];
              
              // Current month birthday (even if passed)
              if (birthdayMonth === currentMonth) {
                const currentMonthBirthday = new Date(currentYear, birthdayMonth, birthdayDay);
                events.push({
                  id: resident.id,
                  name: resident.name,
                  birthday: `${currentYear}-${String(birthdayMonth + 1).padStart(2, '0')}-${String(birthdayDay).padStart(2, '0')}`,
                  location: resident.location,
                  profession: resident.profession,
                  email: resident.email,
                  photo: resident.photo_url ? {
                    url: resident.photo_url,
                    alt: resident.photo_alt || `${resident.name} profile photo`
                  } : undefined,
                  placeholderImage: resident.preferences?.placeholder_image,
                  birthdayThisYear: currentMonthBirthday,
                  interests: resident.interests,
                  yearsInK9: resident.years_in_k9
                });
              }
              
              // Next month birthday
              const nextMonth = (currentMonth + 1) % 12;
              const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
              if (birthdayMonth === nextMonth) {
                const nextMonthBirthday = new Date(nextMonthYear, birthdayMonth, birthdayDay);
                events.push({
                  id: `${resident.id}-next`,
                  name: resident.name,
                  birthday: `${nextMonthYear}-${String(birthdayMonth + 1).padStart(2, '0')}-${String(birthdayDay).padStart(2, '0')}`,
                  location: resident.location,
                  profession: resident.profession,
                  email: resident.email,
                  photo: resident.photo_url ? {
                    url: resident.photo_url,
                    alt: resident.photo_alt || `${resident.name} profile photo`
                  } : undefined,
                  placeholderImage: resident.preferences?.placeholder_image,
                  birthdayThisYear: nextMonthBirthday,
                  interests: resident.interests,
                  yearsInK9: resident.years_in_k9
                });
              }
              
              return events;
            })
            .sort((a, b) => (a.birthdayThisYear?.getTime() || 0) - (b.birthdayThisYear?.getTime() || 0));
        }
        
        // Process custom events
        if (customEventsResponse.ok) {
          fetchedCustomEvents = await customEventsResponse.json();
        }
        
        setCustomEvents(fetchedCustomEvents);
        setAllBirthdays(birthdayEvents);
        
        // Combine all events into a unified format
        const combinedEvents: Event[] = [
          // Birthday events
          ...birthdayEvents.map(birthday => ({
            id: `birthday-${birthday.id}`,
            title: `${birthday.name}'s Birthday`,
            date: birthday.birthday,
            location: birthday.location,
            type: 'birthday' as const,
            birthdayEvent: birthday,
            eventDate: birthday.birthdayThisYear!
          })),
          // Custom events
          ...fetchedCustomEvents.map(customEvent => ({
            id: `custom-${customEvent.id}`,
            title: customEvent.title,
            date: customEvent.start_datetime.split('T')[0], // Extract date part
            location: customEvent.location,
            type: 'custom' as const,
            customEvent: customEvent,
            eventDate: new Date(customEvent.start_datetime)
          }))
        ].sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
        
        setAllEvents(combinedEvents);
        
        // Apply filtering logic to combined events - only show future events
        const futureEvents = combinedEvents.filter(event => event.eventDate >= today);
        
        const fourteenDaysFromNow = new Date(today);
        fourteenDaysFromNow.setDate(today.getDate() + 14);
        
        const threeMonthsFromNow = new Date(today);
        threeMonthsFromNow.setMonth(today.getMonth() + 3);
        
        // First, get future events in the next 14 days
        const eventsInNext14Days = futureEvents.filter(event => 
          event.eventDate <= fourteenDaysFromNow
        );
        
        let finalEvents;
        if (eventsInNext14Days.length >= 3) {
          // If we have 3 or more events in next 14 days, show all of them
          finalEvents = eventsInNext14Days;
        } else {
          // If less than 3 events in next 14 days, show next 3 future events within 3 months
          const eventsInNext3Months = futureEvents.filter(event => 
            event.eventDate <= threeMonthsFromNow
          );
          finalEvents = eventsInNext3Months.slice(0, 3);
        }
        
        setUpcomingEvents(finalEvents);
        
        
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Scroll to detailed view when an event is selected
  useEffect(() => {
    if (selectedEventDate) {
      // Small delay to ensure the component has rendered
      setTimeout(() => {
        const detailsElement = document.getElementById('event-details');
        if (detailsElement) {
          detailsElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  }, [selectedEventDate]);

  const handleCustomEventSubmit = async (formData: CustomEventFormData) => {
    try {
      const response = await fetch('/api/custom-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      // Refresh events by re-running the fetch
      const customEventsResponse = await fetch('/api/custom-events');
      if (customEventsResponse.ok) {
        const updatedCustomEvents = await customEventsResponse.json();
        setCustomEvents(updatedCustomEvents);
        
        // Update combined events
        const combinedEvents: Event[] = [
          // Birthday events
          ...allBirthdays.map(birthday => ({
            id: `birthday-${birthday.id}`,
            title: `${birthday.name}'s Birthday`,
            date: birthday.birthday,
            location: birthday.location,
            type: 'birthday' as const,
            birthdayEvent: birthday,
            eventDate: birthday.birthdayThisYear!
          })),
          // Updated custom events
          ...updatedCustomEvents.map((customEvent: CustomEvent) => ({
            id: `custom-${customEvent.id}`,
            title: customEvent.title,
            date: customEvent.start_datetime.split('T')[0],
            location: customEvent.location,
            type: 'custom' as const,
            customEvent: customEvent,
            eventDate: new Date(customEvent.start_datetime)
          }))
        ].sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
        
        setAllEvents(combinedEvents);
        
        // Re-apply filtering logic
        const today = new Date();
        const fourteenDaysFromNow = new Date(today);
        fourteenDaysFromNow.setDate(today.getDate() + 14);
        
        const threeMonthsFromNow = new Date(today);
        threeMonthsFromNow.setMonth(today.getMonth() + 3);
        
        const eventsInNext14Days = combinedEvents.filter(event => 
          event.eventDate <= fourteenDaysFromNow
        );
        
        let finalEvents;
        if (eventsInNext14Days.length >= 3) {
          finalEvents = eventsInNext14Days;
        } else {
          const eventsInNext3Months = combinedEvents.filter(event => 
            event.eventDate <= threeMonthsFromNow
          );
          finalEvents = eventsInNext3Months.slice(0, 3);
        }
        
        setUpcomingEvents(finalEvents);
      }
      
      alert('Event created successfully!');
      
    } catch (error) {
      console.error('Error creating custom event:', error);
      alert(error instanceof Error ? error.message : 'Failed to create event. Please try again.');
      throw error;
    }
  };


  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const months = [
      { month: currentMonth, year: currentYear },
      { month: (currentMonth + 1) % 12, year: currentMonth === 11 ? currentYear + 1 : currentYear }
    ];
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {months.map(({ month, year }) => {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startingDayOfWeek = firstDay.getDay();
            const daysInMonth = lastDay.getDate();
            
            // Create array of days with events (both birthdays and custom events)
            const eventsInMonth = allEvents.filter(event => {
              const eventDate = event.eventDate;
              return eventDate.getMonth() === month && eventDate.getFullYear() === year;
            });
            
            return (
              <div key={`${year}-${month}`} className="space-y-2">
                <h4 className="font-medium text-gray-800 text-center">
                  {monthNames[month]} {year}
                </h4>
                
                {/* Day names header */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-1">
                  {dayNames.map(day => (
                    <div key={day} className="py-1">{day}</div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: startingDayOfWeek }).map((_, index) => {
                    const isNotLastColumn = (index + 1) % 7 !== 0;
                    return (
                      <div key={`empty-${index}`} className={`h-16 ${isNotLastColumn ? 'border-r border-gray-100' : ''} border-b border-gray-100`}></div>
                    );
                  })}
                  
                  {/* Days of the month */}
                  {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                    const day = dayIndex + 1;
                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const hasEvent = eventsInMonth.some(event => {
                      const eventDay = event.eventDate.getDate();
                      return eventDay === day;
                    });
                    
                    const isToday = year === today.getFullYear() && 
                                   month === today.getMonth() && 
                                   day === today.getDate();
                    
                    const isPast = year < today.getFullYear() || 
                                  (year === today.getFullYear() && month < today.getMonth()) ||
                                  (year === today.getFullYear() && month === today.getMonth() && day < today.getDate());
                    
                    const isHovered = hoveredEventDate === dateString;
                    const isSelected = selectedEventDate === dateString;
                    
                    const totalCells = startingDayOfWeek + daysInMonth;
                    const currentCellIndex = startingDayOfWeek + dayIndex;
                    const isNotLastColumn = (currentCellIndex + 1) % 7 !== 0;
                    const isNotLastRow = Math.ceil(totalCells / 7) !== Math.ceil((currentCellIndex + 1) / 7);
                    
                    return (
                      <div 
                        key={day} 
                        className={`h-16 flex flex-col items-center justify-start pt-1 relative ${
                          isNotLastColumn ? 'border-r border-gray-100' : ''
                        } ${
                          isNotLastRow ? 'border-b border-gray-100' : ''
                        } ${
                          isSelected ? 'bg-blue-100' : isHovered ? 'bg-blue-50' : ''
                        } ${
                          hasEvent ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => hasEvent && setSelectedEventDate(dateString)}
                      >
                        <span className={`text-sm ${
                          isToday ? 'font-bold text-blue-600' : 
                          isPast ? 'text-gray-300' : 
                          isSelected ? 'font-bold text-blue-700' :
                          isHovered ? 'font-bold text-blue-600' :
                          'text-gray-700'
                        }`}>
                          {day}
                        </span>
                        {hasEvent && (
                          <div className={`transition-all ${
                            isHovered ? 'text-base' : 'text-sm'
                          }`}>
                            {(() => {
                              const dayEvents = eventsInMonth.filter(event => {
                                const eventDay = event.eventDate.getDate();
                                return eventDay === day;
                              });
                              
                              // Show different emojis based on event types
                              const hasBirthday = dayEvents.some(event => event.type === 'birthday');
                              const hasCustom = dayEvents.some(event => event.type === 'custom');
                              
                              if (hasBirthday && hasCustom) {
                                return '🎉☕'; // Both types
                              } else if (hasCustom) {
                                return '☕'; // Custom events (coffee emoji)
                              } else {
                                return '🎉'; // Birthday events
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEventDetails = () => {
    if (!selectedEventDate) return null;
    
    const selectedEvents = allEvents.filter(event => event.date === selectedEventDate);
    if (selectedEvents.length === 0) return null;
    
    // Format the selected date for display
    const formatSelectedDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    const daysUntil = Math.ceil((new Date(selectedEventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <div id="event-details" className="mt-16">
        <div className="text-center mb-8">
          <h3 className="text-4xl font-bold text-gray-900">{formatSelectedDate(selectedEventDate)}</h3>
          <p className="text-sm text-gray-500 mt-1">in {daysUntil} days</p>
        </div>
        
        <div className="space-y-8">
          {selectedEvents.map((event, index) => {
            if (event.type === 'birthday' && event.birthdayEvent) {
              const birthday = event.birthdayEvent;
              
              return (
                <div key={event.id}>
                  {index > 0 && (
                    <div className="flex justify-center mb-8">
                      <div className="border-t border-gray-200 w-[70%]"></div>
                    </div>
                  )}
                  <div>
                  <div className="flex items-start gap-6">
                    {/* Profile Image */}
                    <div className="flex-shrink-0">
                      <Link href={`/thek9family?search=${encodeURIComponent(birthday.name)}`}>
                        <div className="w-32 bg-gray-100 flex items-center justify-center rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
                          {birthday.photo?.url ? (
                            <Image
                              src={birthday.photo.url}
                              alt={birthday.photo.alt || `${birthday.name} profile photo`}
                              width={128}
                              height={128}
                              className="w-32 h-auto object-contain rounded-lg"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gray-50 flex items-center justify-center rounded-lg">
                              <Image
                                src={`/missing/${birthday.placeholderImage || 'cat.svg'}`}
                                alt="Profile placeholder illustration"
                                width={96}
                                height={96}
                                className="w-24 h-24"
                              />
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>

                    {/* Birthday Details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🎉</div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">{birthday.name}&apos;s Birthday</h4>
                          {birthday.yearsInK9 && (
                            <p className="text-sm text-gray-500">In K9: {birthday.yearsInK9}</p>
                          )}
                        </div>
                      </div>
                      
                      {birthday.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-lg">🌍</span>
                          <span>{birthday.location}</span>
                        </div>
                      )}
                      
                      {birthday.interests && birthday.interests.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-lg">❤️</span>
                            <span className="font-medium">What I love</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {birthday.interests.map((interest, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {birthday.email && (
                        <div className="pt-2">
                          <div className="flex items-center gap-6">
                            <a 
                              href={`mailto:${birthday.email}`}
                              className="inline-flex items-center gap-2 text-lg font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 px-3 py-1 rounded-md border border-gray-300 hover:border-gray-400"
                            >
                              <span>🎈</span>
                              {birthday.email}
                            </a>
                            <Link 
                              href={`/thek9family?search=${encodeURIComponent(birthday.name)}`}
                              className="text-gray-600 hover:text-gray-800 font-semibold hover:underline"
                            >
                              My profile
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              );
            } else if (event.type === 'custom' && event.customEvent) {
              const customEvent = event.customEvent;
              const startDate = new Date(customEvent.start_datetime);
              
              return (
                <div key={event.id}>
                  {index > 0 && (
                    <div className="flex justify-center mb-8">
                      <div className="border-t border-gray-200 w-[70%]"></div>
                    </div>
                  )}
                  <div className="flex items-start gap-6">
                    {/* Event Image */}
                    <div className="flex-shrink-0">
                      <div className="w-32 bg-gray-100 flex items-center justify-center rounded-lg shadow-lg">
                        {customEvent.visual_url ? (
                          <Image
                            src={customEvent.visual_url}
                            alt="Event visual"
                            width={128}
                            height={128}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gray-50 flex items-center justify-center rounded-lg">
                            <Image
                              src={`/missing/${(() => {
                                const placeholderImages = [
                                  'Animals with Balloons.svg',
                                  'Cat Astronaut Illustration.svg', 
                                  'Cat Pumpkin Illustration.svg',
                                  'Cat Throwing Vase.svg',
                                  'Chicken Eating a Worm.svg',
                                  'Cute Chicken Illustration.svg',
                                  'Diving with Animals.svg',
                                  'Dog Paw Illustration.svg',
                                  'Kiwi Bird Illustration.svg',
                                  'Octopus Vector Illustration.svg',
                                  'Penguin Family Illustration.svg',
                                  'Playful Cat Illustration.svg',
                                  'cat.svg'
                                ];
                                // Use event ID to deterministically choose an image
                                const index = parseInt(customEvent.id.slice(-1), 16) % placeholderImages.length;
                                return placeholderImages[index];
                              })()}`}
                              alt="Event placeholder illustration"
                              width={96}
                              height={96}
                              className="w-24 h-24"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">☕</div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">{customEvent.title}</h4>
                          <p className="text-sm text-gray-500">Organized by {customEvent.organizer_name}</p>
                        </div>
                      </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-0">📅 {startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h5>
                          <p className="text-gray-600 ml-6">
                            {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})} for {customEvent.duration}
                          </p>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">📍 {customEvent.location}</h5>
                        </div>
                        
                        {customEvent.organizer_email && (
                          <div>
                            <a 
                              href={`mailto:${customEvent.organizer_email}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline mb-2 block"
                            >
                              🎈 {customEvent.organizer_email}
                            </a>
                          </div>
                        )}
                        
                        {customEvent.info_link && (
                          <div>
                            <a 
                              href={customEvent.info_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {customEvent.info_link.length > 50 ? customEvent.info_link.substring(0, 50) + '...' : customEvent.info_link}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">📝 About</h5>
                          <p className="text-gray-600 leading-relaxed">{customEvent.description}</p>
                        </div>
                        
                        {customEvent.additional_notes && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">💡 Additional Info</h5>
                            <p className="text-gray-600 leading-relaxed">{customEvent.additional_notes}</p>
                          </div>
                        )}
                        
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Layout>
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="page-header !mb-12">
              <h1 className="page-header-title">
                Events & Gatherings
              </h1>
              <div className="page-header-divider"></div>
              <p className="page-header-subtitle">
                Fikas ☕, shared pizzas 🍕 and birthdays 🎉 - staying connected with your K9 family around the world 🌍
              </p>
            </div>

            <div className="mb-12">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-6">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event, index) => {
                      const formatEventDate = (dateString: string) => {
                        const [, month, day] = dateString.split('-').map(Number);
                        const monthNames = [
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ];
                        return `${monthNames[month - 1]} ${day}`;
                      };
                      
                      return (
                        <div 
                          key={event.id} 
                          className={`flex items-center gap-4 py-4 px-6 transition-colors relative cursor-pointer ${
                            selectedEventDate === event.date ? 'bg-blue-100' :
                            hoveredEventDate === event.date ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onMouseEnter={() => setHoveredEventDate(event.date)}
                          onMouseLeave={() => setHoveredEventDate(null)}
                          onClick={() => setSelectedEventDate(event.date)}
                        >
                          {index > 0 && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-px h-16 bg-gray-200"></div>
                          )}
                          <div className="text-center min-w-[80px]">
                            <div className="text-3xl font-bold text-blue-600 leading-tight">
                              {formatEventDate(event.date).split(' ')[1]}
                            </div>
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-widest">
                              {formatEventDate(event.date).split(' ')[0]}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {Math.ceil((event.eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Event Image or Icon */}
                            <div className="flex-shrink-0">
                              {(() => {
                                let imageUrl = null;
                                if (event.type === 'birthday' && event.birthdayEvent?.photo?.url) {
                                  imageUrl = event.birthdayEvent.photo.url;
                                } else if (event.type === 'custom' && event.customEvent?.visual_url) {
                                  imageUrl = event.customEvent.visual_url;
                                }
                                
                                if (imageUrl) {
                                  return (
                                    <div className="relative">
                                      <img 
                                        src={imageUrl} 
                                        alt="Event" 
                                        className="w-24 h-24 rounded-full object-cover border border-gray-200"
                                      />
                                      <div className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full border border-gray-100 w-6 h-6 flex items-center justify-center">
                                        {event.type === 'birthday' ? '🎉' : '☕'}
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return <div className="text-2xl">{event.type === 'birthday' ? '🎉' : '☕'}</div>;
                                }
                              })()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                              {event.location && (
                                <p className="text-sm text-gray-500">{event.location}</p>
                              )}
                              {event.type === 'custom' && event.customEvent && (
                                <p className="text-xs text-gray-400">by {event.customEvent.organizer_name}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No upcoming events found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            {!loading && (allBirthdays.length > 0 || customEvents.length > 0) && (
              <div className="flex justify-center my-8">
                <div className="border-t border-gray-200 w-2/5"></div>
              </div>
            )}
            
            {/* Calendar View */}
            {renderCalendar()}

            {/* Event Details */}
            {selectedEventDate && renderEventDetails()}

            {/* Add Event Button */}
            <div className="text-center mt-16 mb-8">
              <button 
                onClick={() => setIsCustomEventFormOpen(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
              >
                Create Your Own Event
              </button>
            </div>
          </div>
        </div>
      </Layout>
      
      <CustomEventForm
        isOpen={isCustomEventFormOpen}
        onClose={() => setIsCustomEventFormOpen(false)}
        onSubmit={handleCustomEventSubmit}
      />
    </>
  );
}