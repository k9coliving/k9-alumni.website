# Airtable Integration Documentation

## Overview

This document captures findings and implementation details for integrating with Airtable's Shared View API to retrieve alumni data for the K9 Alumni Website.

## Alumni Data Retrieval - ✅ Working

Successfully implemented alumni list retrieval using Airtable's Shared View API:

- **API Endpoint**: `https://airtable.com/v0.3/view/{viewId}/readSharedViewData`
- **Authentication**: Uses access policy with signature and expiry
- **Data Retrieved**: 35 alumni records with complete profile information
- **Implementation**: `/src/lib/airtable.ts` - `getResidentListingData()` function
- **Page**: `/thek9family` displays alumni in responsive grid format

The API returns structured data including names, locations, professions, interests, contact information, and residence periods at K9.

## Profile Images Issue - ❌ Not Solvable with Current API

### Problem

Airtable attachment URLs are no longer publicly accessible due to a breaking change implemented on November 8, 2022.

### Technical Details

**Old Format (No longer works):**
```
https://dl.airtable.com/.directUploadAttachment/db4d94dad624ca833cc94c967af74c7b/d2115245/IMG_1912.jpg
```

**New Format (Works but expires every ~2 hours):**
```
https://v5.airtableusercontent.com/v3/u/44/44/1755388800000/3ktLgJK6xM0S1JcKxcBa2w/...
```

### Root Cause

According to Airtable's official documentation:

1. **Breaking Change Announcement**: [Airtable Community - Breaking change: URLs to attachments have been modified](https://community.airtable.com/t5/development-apis/breaking-change-urls-to-attachments-have-been-modified/td-p/79821)

2. **Security Update**: Airtable introduced expiring attachment URLs to increase attachment security

3. **API Limitation**: The Shared View API only returns old `dl.airtable.com` URLs, not the new working `airtableusercontent.com` URLs

4. **Expiration**: New URLs expire every ~2 hours and are only available through embedded views

### Solution Implemented

**Graceful Fallback with Initials:**
- ProfileImage component detects Airtable URLs and shows initials instead
- Beautiful gradient circles with user initials (e.g., "JS" for Jhonatan Serna)
- Consistent visual experience across all alumni profiles
- No broken images or loading errors

### Alternative Solutions Considered

1. **Image Proxy**: Attempted but failed - private URLs return 403/404 even with authentication
2. **Thumbnail URLs**: Also private and inaccessible  
3. **Signed URLs Endpoint**: No response from `readSignedAttachmentUrls` action
4. **Embedded View Scraping**: Not feasible due to cross-origin restrictions

### References

- [Airtable Attachment URL Behavior Documentation](https://support.airtable.com/docs/airtable-attachment-url-behavior)
- [Community Discussion - Difference in attachment URL](https://community.airtable.com/t5/formulas/difference-in-attachment-url/td-p/148414)
- [Community Discussion - Attachment URLs are public?](https://community.airtable.com/other-questions-13/attachment-urls-are-public-15928)

## Recommendations

1. **Current Approach**: Continue using initials fallback - provides excellent UX
2. **Future Enhancement**: Consider asking alumni to upload photos to a different service if profile images become a priority
3. **Alternative**: Use Airtable's form embedding for new submissions with image handling through their interface

## Technical Implementation

### API Configuration

Environment variables required:
```
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_ALUMNI_VIEW_ID=your_view_id
AIRTABLE_ALUMNI_SHARE_ID=your_share_id
```

### Optimized Headers

Reduced from 25 headers to just 3 essential ones:
```javascript
headers: {
  'x-requested-with': 'XMLHttpRequest',
  'x-time-zone': 'Europe/Istanbul', 
  'x-airtable-application-id': params.baseId,
}
```

### Data Transformation

Maps Airtable column structure to clean application format:
- `'Show your pretty face?'` → profile photo
- `'Where do you live?'` → location
- `'What do you do?'` → profession
- `'What are your interests?'` → interests array
- etc.

---

*Last updated: August 16, 2025*