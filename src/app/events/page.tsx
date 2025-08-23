'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/Layout';

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

export default function Events() {
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayEvent[]>([]);
  const [allBirthdays, setAllBirthdays] = useState<BirthdayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredEventDate, setHoveredEventDate] = useState<string | null>(null);
  const [selectedEventDate, setSelectedEventDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUpcomingBirthdays() {
      try {
        const response = await fetch('/api/residents');
        if (response.ok) {
          const residents = await response.json();
          
          const today = new Date();
          const currentYear = today.getFullYear();
          
          // Filter residents with birthdays and convert to events
          const birthdayEvents = residents
            .filter((resident: any) => resident.birthday)
            .map((resident: any) => {
              // Extract month and day from birthday (ignore the stored year - birthdays repeat annually)
              const birthday = new Date(resident.birthday);
              const birthdayMonth = birthday.getMonth(); // 0-indexed
              const birthdayDay = birthday.getDate();
              
              // Create birthday for current year
              const thisYearBirthday = new Date(currentYear, birthdayMonth, birthdayDay);
              
              // If birthday already passed this year, show next year's birthday
              if (thisYearBirthday < today) {
                thisYearBirthday.setFullYear(currentYear + 1);
              }
              
              return {
                id: resident.id,
                name: resident.name,
                birthday: `${thisYearBirthday.getFullYear()}-${String(thisYearBirthday.getMonth() + 1).padStart(2, '0')}-${String(thisYearBirthday.getDate()).padStart(2, '0')}`,
                location: resident.location,
                profession: resident.profession,
                email: resident.email,
                photo: resident.photo_url ? {
                  url: resident.photo_url,
                  alt: resident.photo_alt || `${resident.name} profile photo`
                } : undefined,
                placeholderImage: resident.preferences?.placeholder_image,
                birthdayThisYear: thisYearBirthday,
                interests: resident.interests,
                yearsInK9: resident.years_in_k9
              };
            })
            .sort((a: any, b: any) => a.birthdayThisYear - b.birthdayThisYear);

          // Custom filtering logic
          const fourteenDaysFromNow = new Date(today);
          fourteenDaysFromNow.setDate(today.getDate() + 14);
          
          const threeMonthsFromNow = new Date(today);
          threeMonthsFromNow.setMonth(today.getMonth() + 3);
          
          // First, get events in the next 14 days
          const eventsInNext14Days = birthdayEvents.filter(event => 
            event.birthdayThisYear <= fourteenDaysFromNow
          );
          
          let finalEvents;
          if (eventsInNext14Days.length >= 3) {
            // If we have 3 or more events in next 14 days, show all of them
            finalEvents = eventsInNext14Days;
          } else {
            // If less than 3 events in next 14 days, show next 3 events within 3 months
            const eventsInNext3Months = birthdayEvents.filter(event => 
              event.birthdayThisYear <= threeMonthsFromNow
            );
            finalEvents = eventsInNext3Months.slice(0, 3);
          }
          
          setUpcomingBirthdays(finalEvents);
          
          // Also set all events for calendar display (not just filtered ones)
          setAllBirthdays(birthdayEvents);
        }
      } catch (error) {
        console.error('Error fetching birthdays:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUpcomingBirthdays();
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

  const formatBirthdayDate = (dateString: string) => {
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[month - 1]} ${day}`;
  };

  const formatBirthdayDateEuropean = (dateString: string) => {
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${day} ${monthNames[month - 1]}`;
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
          {months.map(({ month, year }, monthIndex) => {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startingDayOfWeek = firstDay.getDay();
            const daysInMonth = lastDay.getDate();
            
            // Create array of days with events
            const eventsInMonth = allBirthdays.filter(birthday => {
              const eventDate = birthday.birthdayThisYear;
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
                    const hasEvent = eventsInMonth.some(birthday => {
                      const eventDay = birthday.birthdayThisYear.getDate();
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
                          }`}>🎉</div>
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
    
    const selectedEvent = allBirthdays.find(birthday => birthday.birthday === selectedEventDate);
    if (!selectedEvent) return null;
    
    return (
      <div id="event-details" className="mt-16">
        <div className="text-center mb-8">
          <h3 className="text-4xl font-bold text-gray-900">{formatBirthdayDateEuropean(selectedEvent.birthday)} {selectedEvent.birthdayThisYear.getFullYear()}</h3>
          <p className="text-sm text-gray-500 mt-1">in {Math.ceil((selectedEvent.birthdayThisYear - new Date()) / (1000 * 60 * 60 * 24))} days</p>
        </div>
        
        <div className="flex items-start gap-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <Link href={`/thek9family?search=${encodeURIComponent(selectedEvent.name)}`}>
              <div className="w-56 bg-gray-100 flex items-center justify-center rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
                {selectedEvent.photo?.url ? (
                  <Image
                    src={selectedEvent.photo.url}
                    alt={selectedEvent.photo.alt || `${selectedEvent.name} profile photo`}
                    width={224}
                    height={224}
                    className="w-56 h-auto object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-56 h-56 bg-gray-50 flex items-center justify-center rounded-lg">
                    <Image
                      src={`/missing/${selectedEvent.placeholderImage || 'cat.svg'}`}
                      alt="Profile placeholder illustration"
                      width={192}
                      height={192}
                      className="w-48 h-48"
                    />
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Event Details */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎉</div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{selectedEvent.name}'s Birthday</h4>
                {selectedEvent.yearsInK9 && (
                  <p className="text-sm text-gray-500">In K9: {selectedEvent.yearsInK9}</p>
                )}
              </div>
            </div>
            
            {selectedEvent.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-lg">🌍</span>
                <span>{selectedEvent.location}</span>
              </div>
            )}
            
            {selectedEvent.interests && selectedEvent.interests.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-lg">❤️</span>
                  <span className="font-medium">What I love</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.interests.map((interest, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {selectedEvent.email && (
              <div className="pt-2">
                <div className="flex items-center gap-6">
                  <a 
                    href={`mailto:${selectedEvent.email}`}
                    className="inline-flex items-center gap-2 text-xl font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 px-3 py-1 rounded-md border border-gray-300 hover:border-gray-400 font-parisienne"
                  >
                    <span>🎈</span>
                    {selectedEvent.email}
                  </a>
                  <Link 
                    href={`/thek9family?search=${encodeURIComponent(selectedEvent.name)}`}
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
    );
  };

  return (
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
                {upcomingBirthdays.length > 0 ? (
                  upcomingBirthdays.map((birthday, index) => (
                    <div 
                      key={birthday.id} 
                      className={`flex items-center gap-4 py-4 px-6 transition-colors relative cursor-pointer ${
                        selectedEventDate === birthday.birthday ? 'bg-blue-100' :
                        hoveredEventDate === birthday.birthday ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onMouseEnter={() => setHoveredEventDate(birthday.birthday)}
                      onMouseLeave={() => setHoveredEventDate(null)}
                      onClick={() => setSelectedEventDate(birthday.birthday)}
                    >
                      {index > 0 && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-px h-16 bg-gray-200"></div>
                      )}
                      <div className="text-center min-w-[80px]">
                        <div className="text-3xl font-bold text-blue-600 leading-tight">
                          {formatBirthdayDate(birthday.birthday).split(' ')[1]}
                        </div>
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-widest">
                          {formatBirthdayDate(birthday.birthday).split(' ')[0]}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {Math.ceil((birthday.birthdayThisYear - new Date()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🎉</div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{birthday.name}</h3>
                          {birthday.location && (
                            <p className="text-sm text-gray-500">{birthday.location}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No upcoming events found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          {!loading && allBirthdays.length > 0 && (
            <div className="flex justify-center my-8">
              <div className="border-t border-gray-200 w-2/5"></div>
            </div>
          )}

          {/* Calendar View */}
          {!loading && allBirthdays.length > 0 && renderCalendar()}

          {/* Event Details */}
          {selectedEventDate && renderEventDetails()}
        </div>
      </div>
    </Layout>
  );
}