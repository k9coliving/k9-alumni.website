'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const navigationItems = [
  { name: 'Meet Alumni', href: '/thek9family', enabled: true },
  { name: 'Newsletter', href: '/newsletter', enabled: true },
  { name: 'Upcoming Gatherings', href: '/events', enabled: true },
  { name: 'Tips & Offers', href: '/tips', enabled: true },
  { name: 'Hold my Hair', href: '/holdmyhair', enabled: true },
  { name: 'Moving Somewhere New?', href: '/relocation', enabled: false },
  { name: 'Who are we', href: '/who-are-we', enabled: true },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center hover:opacity-75 transition-opacity"
            >
              <Image 
                src="/k9-alumni-logo.png" 
                alt="K9 Alumni Logo" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-3">
            {navigationItems.map((item, index) => {
              const hoverColors = [
                'hover:text-cyan-600', // Meet Alumni
                'hover:text-amber-600', // Newsletter
                'hover:text-violet-600', // Upcoming Gatherings
                'hover:text-blue-600', // Tips & Offers
                'hover:text-pink-600', // Hold my Hair
                'hover:text-orange-600', // Moving Somewhere New?
                'hover:text-green-600', // Who are we
              ];
              
              if (!item.enabled) {
                return (
                  <div
                    key={item.name}
                    className="relative px-3 py-2 text-sm font-medium text-gray-400 cursor-default"
                  >
                    {item.name}
                    <span className="absolute -top-1 -right-1 bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                      Soon
                    </span>
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-gray-700 ${hoverColors[index]} px-3 py-2 text-sm font-medium transition-all duration-200 transform hover:scale-105`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-gray-900 p-2"
              aria-label="Open menu"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {isOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
            {navigationItems.map((item, index) => {
              const hoverColors = [
                'hover:text-cyan-600', // Meet Alumni
                'hover:text-amber-600', // Newsletter
                'hover:text-violet-600', // Upcoming Gatherings
                'hover:text-blue-600', // Tips & Offers
                'hover:text-pink-600', // Hold my Hair
                'hover:text-orange-600', // Moving Somewhere New?
                'hover:text-green-600', // Who are we
              ];
              
              if (!item.enabled) {
                return (
                  <div
                    key={item.name}
                    className="relative block px-3 py-2 text-base font-medium text-gray-400 cursor-default"
                  >
                    {item.name}
                    <span className="absolute top-1 right-3 bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                      Soon
                    </span>
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-medium text-gray-700 ${hoverColors[index]} transition-all duration-200 transform hover:scale-105`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}