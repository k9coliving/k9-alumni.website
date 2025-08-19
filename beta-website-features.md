# Beta K9 Alumni Website - Features Documentation

## Overview
URL: https://madebymom.my.canva.site/k9alumni/
Password Protection: Single shared password with reCAPTCHA verification

## Navigation Structure
The website has a horizontal navigation menu with the following sections:
- Home
- Who are we  
- New
- Events
- Relocation
- Database
- tips
- holdmyhair
- Newsletter

## Section-by-Section Features

### 1. Home Page
**Purpose**: Main landing page with quick access links to all major features
**Features**:
- Quick access buttons/links to:
  - Alumni Database
  - Newsletter  
  - New alumni onboarding
  - Tips & offerings
  - Hold my Hair (support requests)
  - Upcoming events
  - Relocation assistance
  - Who are we (team page)
- Visual layout with images and icons for each section
- Footer with "Made with childish love by Mo" credit

### 2. Who Are We
**Purpose**: Team introduction page showing the people behind the alumni network
**Features**:
- "This is Us" heading
- Team member profiles with photos and names:
  - Abhi - in house mole
  - Mo - Newsletter whisperer  
  - Jho - Onboarding boss
  - Flow - Map Master
  - Per - Summit Guru
  - Annelise - Chief Event Officer
  - Camelia - Tips & offer Fairy
  - You? (placeholder for new members)
- Visual grid layout with headshots and role descriptions

### 3. New (Onboarding)
**Purpose**: Information and onboarding for new K9 alumni and current residents
**Features**:
- "New here?" heading
- Welcome messaging:
  - "Are you a K9 alumni, or did you just give your notice? We're here for you!"
  - "Are you a curious current resident? We're here for your too!"
- Mission statement:
  - "Whether you've been a K9er for a few months or many years, moving out is never easy."
  - "We are on a journey to build a strong alumni network, so the K9 magic lives on, outside the walls of the house."
- Three main goals:
  - "We have three main goals:"
  1. "Stay in touch on and offline"
  2. "support each other emotionally, professionally and in any other way possible"
  3. "Build relationships between alumni and current residents"
- Quick action buttons linking to:
  - Events section
  - Hold my Hair section
  - Tips section
- Direct Airtable form links for:
  - "Join the database"
  - "Update your data"
- Call-to-action sections for:
  - "Share an event"
  - "Ask for help"
  - "Share a tip/an offer"

### 4. Events
**Purpose**: Event management and calendar display
**Features**:
- "Upcoming events" heading
- Embedded calendar iframe (appears to be from external calendar service)
- "Add an event" button linking to Airtable form
- Process explanation: "you post your event and it will appear on the calendar. We will also add it to the upcoming newsletter."
- Visual layout with event-related imagery

### 5. Relocation
**Purpose**: Location-based alumni search to help with relocations
**Features**:
- "Relocation" heading with decorative styling
- Embedded searchable database iframe (filtered by location)
- Instructional text: "Here, you can search the database by location. Do not hesitate to reach out to someone who lives in the place you will soon call Home!"
- Visual elements with location/map imagery

### 6. Database
**Purpose**: Full alumni database view and management
**Features**:
- "Alumni Database" heading
- Embedded Airtable database view iframe
- "Join the database" button with direct Airtable form link
- Process explanation: "you can view a larger version of the database by clicking the button at the bottom. You can also filter your search."
- Visual layout with database/connection imagery

### 7. Tips
**Purpose**: Tips and offerings exchange between alumni
**Features**:
- "Tips & offerings" heading
- "Add a tip or an offering" button linking to Airtable form
- Embedded Airtable view iframe showing current tips/offerings
- Process explanation: "You post your tip/offering and it will appear on this page. You can view a larger version and search through using the button at the bottom. We will also add it to the upcoming newsletter."
- Visual elements related to sharing/community

### 8. Holdmyhair (Support Requests)
**Purpose**: Platform for alumni to request help from the community
**Features**:
- "Hold my Hair" heading (playful name for support system)
- "Ask for help" button linking to Airtable form
- Embedded Airtable view iframe showing current help requests
- Process explanation: "you post your tip/offering and it will appear on this page. You can view a larger version and search through using the button at the bottom. We will also review it to see if we can match it with another alumni's set of skills and we will add it to the upcoming newsletter."
- Matching service: Manual review to connect help requests with skilled alumni

### 9. Newsletter
**Purpose**: Newsletter subscription, content submission, and archive access
**Features**:
- "Newsletter" heading
- Two main action buttons:
  - "Share your updates" - links to Airtable form for newsletter submissions
  - "Read the last newsletter" - external link to newsletter archive
- Process information:
  - Quarterly publication schedule
  - Automatic subscription when joining database
  - Reminder system: "You will receive a reminder to add updates a week before"
- Visual newsletter-themed imagery

## Technical Architecture
- **Authentication**: Single password with Google reCAPTCHA
- **Data Management**: Multiple Airtable bases and forms
- **External Integrations**: 
  - Calendar system (embedded iframe)
  - Newsletter platform (external links)
  - Airtable database views and forms

## User Flow Patterns
1. **New User Onboarding**: New section → Database signup → Automatic newsletter subscription
2. **Event Sharing**: Events section → Add event form → Calendar display + Newsletter inclusion
3. **Help Requests**: Holdmyhair section → Help form → Manual matching + Newsletter inclusion  
4. **Tips Sharing**: Tips section → Tips form → Public display + Newsletter inclusion
5. **Relocation Assistance**: Relocation section → Search by location → Direct contact encouragement

## Design Principles
- Clean, visual design with imagery for each section
- Consistent navigation across all pages
- Clear call-to-action buttons
- Process explanations for each feature
- Community-focused messaging and tone
- Mobile-responsive layout