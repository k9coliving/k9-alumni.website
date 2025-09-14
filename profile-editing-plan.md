# User Profile Editing Plan - Email-Based Authentication

:warn: feature blocked until we get the domain validation for Resend from Per -> https://keinain.slack.com/archives/C094U0ZQHGB/p1757782918754209
At the moment we'd only be able to send emails to my signup address, and no other email addresses, which makes the feature pointless. 

## Overview
Implement a secure profile editing system for The K9 Family page where users can edit their profiles through email-authenticated links without requiring individual user accounts. Also the user will be able to delete their profile completely. 

Future considerations: a similar system with email validation will be used for editing / removing hold my hair and tips and tricks entries. 

## UX Flow
1. **Hover edit**: Small edit icon appears on profile card hover
2. **Confirmation popup**: Click → "Send edit link to [email]?" with Cancel/Send buttons
3. **Email sending**: User confirms → secure link sent to registered email address
4. **Success feedback**: "Edit link sent! Check your inbox." confirmation message
5. **Edit workflow**: User clicks email link → edits profile on dedicated page

## Technical Implementation

### 1. Hover UI Components
- Add edit icon overlay that appears on profile card hover
- Style consistently with existing design system
- Position edit icon appropriately on card

### 2. Confirmation Modal
- Create popup modal with email preview
- Include Cancel and Send confirmation buttons
- Show the email address that will receive the link
- Handle modal open/close states

### 3. Token System
- Generate JWT tokens with 7-day expiry for secure editing sessions
- Include profile-specific claims in token
- Store tokens temporarily in database with cleanup
- Validate tokens on edit page access

### 4. Email Service
- Set up email service integration (Resend) - see .env.local for api key
- Create professional email templates with edit links
- Include clear instructions and security information
- Handle email delivery failures gracefully
- **Log all email attempts and errors in audit_logs table** for monitoring and debugging

### 5. Edit Interface
- Build dedicated profile editing page accessible only via valid token
- Create comprehensive form with all editable profile fields
- Implement client-side and server-side validation
- Add image upload capability for profile photos
- Include preview functionality before saving changes

### 6. API Endpoints
- `POST /api/profiles/request-edit`: Send edit link to profile email
- `GET /api/profiles/edit/[token]`: Validate token and load edit page
- `PUT /api/profiles/[id]`: Update profile data with proper validation
- Include proper error handling and security measures
- **Log all profile updates in audit_logs table** with before/after values for tracking changes

## Technical Details

### Database Considerations
- Store temporary edit tokens with expiration dates
- Link tokens to specific profile IDs
- Implement automatic cleanup of expired tokens

### Security Measures
- Validate all input data server-side
- Sanitize user inputs to prevent XSS
- Rate limiting on email sending endpoints
- Secure token generation and validation
- Proper error handling without information disclosure
- **Audit logging**: Log all email sends, failures, profile edit attempts, and profile updates in audit_logs table

### Email Template
- Professional, branded email design
- Clear call-to-action button for edit link
- Instructions for users
- Security notice about link expiration (7 days)
- Contact information for support

## Implementation Tasks

1. **Design email-based authentication system for profile editing**
2. **Create secure token generation and validation system**
3. **Build email sending service for edit links**
4. **Create profile editing page with form validation**
5. **Implement profile data update API endpoints**
6. **Add hover edit link to each profile card**
7. **Create confirmation popup before sending email**
8. **Create success confirmation after email sent**
9. **Test complete workflow from hover click to profile update**

## Key Benefits
- No email input required (uses existing database email)
- Clear user communication and control over the process
- 7-day token validity for user convenience
- Secure token-based authentication without user accounts
- Smooth, intuitive editing experience
- Maintains existing security model of the application

## Future Considerations
- Email delivery monitoring and retry mechanisms
- Enhanced profile fields as the alumni database grows
- Bulk profile update capabilities for administrators
- Profile change history and audit logging