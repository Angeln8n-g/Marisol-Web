# Implementation Plan: Clinic Location Management

## Overview

This implementation plan converts the clinic location management design into actionable coding tasks. The system enables administrators to manage multiple dental clinic locations through an admin panel and allows users to view clinics on an interactive map, check appointment availability, and select a clinic for booking.

The implementation follows a layered architecture approach:
1. Database schema and migrations
2. Core data models and validation
3. Backend services and API hooks
4. Frontend components (admin and user-facing)
5. Integration and testing

## Tasks

- [x] 1. Set up database schema and core infrastructure
  - [x] 1.1 Create Supabase migration for clinics table enhancement
    - Add new fields: latitude, longitude, operating_hours, special_hours, is_active, is_deleted
    - Create GIST index for geographic queries on (latitude, longitude)
    - Create B-tree index on is_active for filtering
    - Add trigger for updated_at timestamp
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_
  
  - [x] 1.2 Create TypeScript type definitions and Zod schemas
    - Define Clinic, OperatingHours, DayHours, SpecialHour interfaces
    - Define ClinicWithAvailability, CreateClinicDTO, UpdateClinicDTO interfaces
    - Define GeocodingResult, AvailabilityQuery, AvailabilityResult interfaces
    - Implement DayHoursSchema, OperatingHoursSchema, SpecialHourSchema
    - Implement CreateClinicSchema with coordinate validation
    - Implement UpdateClinicSchema as partial of CreateClinicSchema
    - _Requirements: 1.2, 1.5, 1.6, 7.1, 7.2_
  
  - [x] 1.3 Install and configure required dependencies
    - Install leaflet, react-leaflet for mapping
    - Install @tanstack/react-query for server state management
    - Install zod for validation
    - Install zustand if not already present
    - Configure TypeScript types for all libraries
    - _Requirements: 2.1, 2.2_

- [ ] 2. Checkpoint - Verify database and types
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement core services layer
  - [x] 3.1 Create LocationService class
    - Implement getClinicsWithAvailability() method
    - Implement createClinic() method with Zod validation
    - Implement updateClinic() method with Zod validation
    - Implement deleteClinic() method (soft delete)
    - Implement validateAddress() method
    - Implement checkCoordinateConsistency() method
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 7.1, 7.3_
  
  - [x] 3.2 Create AvailabilityService class
    - Implement getClinicAvailability() method
    - Implement hasAvailability() method for 30-day check
    - Implement getNextAvailableDate() method
    - Handle integration with existing appointment system
    - _Requirements: 3.1, 3.2, 3.5, 6.1, 6.2, 6.4_
  
  - [x] 3.3 Create GeocodingService class
    - Implement geocodeAddress() using Nominatim API
    - Implement reverseGeocode() for coordinate-to-address conversion
    - Implement validateCoordinates() method
    - Add error handling for API failures
    - _Requirements: 7.2, 7.4_
  
  - [x] 3.4 Write unit tests for services
    - Test LocationService CRUD operations
    - Test AvailabilityService calculations
    - Test GeocodingService API integration
    - Test validation edge cases
    - _Requirements: 1.5, 1.6, 7.1, 7.2_

- [x] 4. Implement React Query hooks for data management
  - [x] 4.1 Create useClinicLocations hook
    - Implement query with includeInactive and includeAvailability options
    - Configure 5-minute stale time and auto-refresh
    - _Requirements: 2.1, 2.2, 6.5_
  
  - [x] 4.2 Create useClinicAvailability hook
    - Implement query for single clinic availability
    - Configure 5-minute stale time
    - Enable query only when clinicId is provided
    - _Requirements: 3.1, 3.2, 3.6_
  
  - [x] 4.3 Create mutation hooks for admin operations
    - Implement useCreateClinic with cache invalidation
    - Implement useUpdateClinic with cache invalidation
    - Implement useDeleteClinic with cache invalidation
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [x] 4.4 Create useGeocode hook for address geocoding
    - Implement mutation for geocoding requests
    - Handle loading and error states
    - _Requirements: 7.4_
  
  - [x] 4.5 Create useClinicOperatingStatus hook
    - Calculate if clinic is currently open based on operating_hours
    - Check special_hours for holiday exceptions
    - Update status every minute
    - _Requirements: 8.1, 8.3, 8.4, 8.5_
  
  - [x] 4.6 Write unit tests for custom hooks
    - Test useClinicLocations with different options
    - Test useClinicAvailability with various clinic IDs
    - Test mutation hooks success and error paths
    - Test useClinicOperatingStatus time calculations
    - _Requirements: 3.5, 8.4, 8.5_

- [x] 5. Checkpoint - Verify data layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement admin panel components
  - [x] 6.1 Create LocationManagerForm component
    - Build form with fields for name, address, coordinates, phone, whatsapp
    - Integrate Zod validation with real-time error display
    - Add operating hours configuration UI (7 days with open/close times)
    - Add special hours configuration UI (date, reason, hours)
    - Implement mini-map for manual coordinate adjustment
    - Add geocoding button to auto-fill coordinates from address
    - Handle create and edit modes
    - _Requirements: 1.1, 1.2, 7.1, 7.4, 7.5, 8.2, 8.3_
  
  - [x] 6.2 Create admin location list view
    - Display table of all clinics with name, address, status
    - Add "Add New Location" button
    - Add edit and delete actions for each clinic
    - Show active/inactive status indicators
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [x] 6.3 Integrate LocationManagerForm with admin panel routing
    - Add routes for /admin/locations, /admin/locations/new, /admin/locations/:id/edit
    - Connect form submission to mutation hooks
    - Handle success/error notifications
    - Implement navigation after successful operations
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 6.4 Write integration tests for admin components
    - Test form validation and submission
    - Test geocoding integration
    - Test edit and delete flows
    - _Requirements: 1.2, 1.3, 1.4, 7.4_

- [x] 7. Implement user-facing map components
  - [x] 7.1 Create InteractiveMap component
    - Initialize Leaflet map with default center and zoom
    - Render ClinicPin components for each clinic
    - Handle clinic selection state
    - Support zoom and pan interactions
    - Implement real-time updates when clinics change
    - Add touch gesture support for mobile
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 10.2_
  
  - [x] 7.2 Create ClinicPin component
    - Render custom marker with availability color (green/red)
    - Show tooltip on hover with clinic name
    - Animate on selection
    - Handle click events
    - _Requirements: 2.3, 3.3, 3.4_
  
  - [x] 7.3 Create ClinicDetailsPopup component
    - Display clinic name, address, phone, whatsapp
    - Show operating hours for current day
    - Display "Open Now" or "Currently Closed" indicator
    - Show availability status and slot count for next 7 days
    - Add "Book Appointment" button (enabled only if slots available)
    - Add close button
    - _Requirements: 2.3, 3.6, 4.1, 4.2, 4.4, 8.1, 8.4, 8.5_
  
  - [x] 7.4 Create ClinicSearchFilter component
    - Add search input with debouncing (500ms)
    - Add filter buttons: "All Clinics", "Available Now", "Open Today"
    - Add sort dropdown: by name, distance, availability
    - Add clear filters button
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 7.5 Write unit tests for map components
    - Test InteractiveMap rendering and interactions
    - Test ClinicPin color logic based on availability
    - Test ClinicDetailsPopup data display
    - Test ClinicSearchFilter filtering and sorting
    - _Requirements: 2.2, 3.3, 3.4, 9.2, 9.4_

- [x] 8. Checkpoint - Verify UI components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement booking flow integration
  - [x] 9.1 Add clinic selection to appointment booking flow
    - Modify appointment booking component to accept pre-selected clinic ID
    - Filter available time slots by selected clinic
    - Display selected clinic information in booking form
    - _Requirements: 4.2, 4.3, 6.2, 6.3_
  
  - [x] 9.2 Implement "Book Appointment" navigation
    - Handle button click in ClinicDetailsPopup
    - Navigate to booking flow with clinic ID parameter
    - Pass clinic data to booking context/state
    - _Requirements: 4.1, 4.2_
  
  - [x] 9.3 Handle no-availability scenarios
    - Display message when clinic has no available slots
    - Suggest alternative nearby clinics (if multiple exist)
    - Disable "Book Appointment" button when no availability
    - _Requirements: 4.4, 4.5_
  
  - [ ] 9.4 Write integration tests for booking flow
    - Test navigation with pre-selected clinic
    - Test time slot filtering by clinic
    - Test no-availability message display
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 10. Implement responsive design and accessibility
  - [x] 10.1 Add responsive styles for map and components
    - Ensure map renders correctly from 320px to 2560px width
    - Adjust popup size and position for mobile screens
    - Make admin form responsive with proper breakpoints
    - Test on mobile, tablet, and desktop viewports
    - _Requirements: 10.1_
  
  - [x] 10.2 Add accessibility features
    - Add ARIA labels to map controls and pins
    - Implement keyboard navigation for map and popups
    - Ensure proper focus management
    - Add screen reader announcements for availability changes
    - _Requirements: 10.3, 10.4_
  
  - [x] 10.3 Implement fallback list view
    - Create list view component showing all clinics
    - Display when map fails to load
    - Include all clinic information and booking links
    - _Requirements: 10.5_
  
  - [ ] 10.4 Write accessibility tests
    - Test keyboard navigation
    - Test screen reader compatibility
    - Test ARIA label presence
    - _Requirements: 10.3, 10.4_

- [x] 11. Implement error handling and edge cases
  - [x] 11.1 Add error handling for service failures
    - Handle Supabase connection errors
    - Handle geocoding API failures
    - Handle appointment system unavailability
    - Display user-friendly error messages
    - _Requirements: 6.4_
  
  - [x] 11.2 Add validation warnings for inconsistent data
    - Warn when coordinates and address don't match
    - Warn when coordinates are (0,0)
    - Allow saving despite warnings
    - _Requirements: 1.5, 7.3_
  
  - [x] 11.3 Handle real-time update failures
    - Implement retry logic for failed updates
    - Show stale data indicator when updates fail
    - Provide manual refresh option
    - _Requirements: 1.3, 2.6, 3.5_
  
  - [ ] 11.4 Write error handling tests
    - Test service failure scenarios
    - Test validation warning display
    - Test retry logic
    - _Requirements: 6.4, 7.3_

- [x] 12. Final integration and polish
  - [x] 12.1 Integrate map component into landing page
    - Add InteractiveMap to landing page layout
    - Position map prominently on page
    - Ensure proper loading states
    - _Requirements: 2.1, 2.2_
  
  - [x] 12.2 Add loading and empty states
    - Show skeleton loader while clinics are loading
    - Display message when no clinics exist
    - Show spinner during geocoding operations
    - _Requirements: 2.2_
  
  - [x] 12.3 Optimize performance
    - Implement map marker clustering for many clinics
    - Debounce search and filter operations
    - Lazy load map component
    - Optimize re-renders with React.memo where appropriate
    - _Requirements: 2.2, 9.2_
  
  - [ ] 12.4 Write end-to-end integration tests
    - Test complete admin flow: create, edit, delete clinic
    - Test complete user flow: view map, select clinic, book appointment
    - Test real-time updates across admin and user views
    - _Requirements: 1.2, 1.3, 1.4, 2.6, 4.2_

- [x] 13. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The implementation uses TypeScript throughout for type safety
- All database operations use Supabase client with typed queries
- Map functionality uses Leaflet with React-Leaflet bindings
- State management uses TanStack Query for server state and Zustand for client state
- Validation uses Zod schemas for runtime type checking
- The design document does not include correctness properties, so property-based tests are not included

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "4.1", "4.2", "4.5"] },
    { "id": 4, "tasks": ["4.3", "4.4"] },
    { "id": 5, "tasks": ["4.6", "6.1", "7.1"] },
    { "id": 6, "tasks": ["6.2", "7.2", "7.4"] },
    { "id": 7, "tasks": ["6.3", "7.3"] },
    { "id": 8, "tasks": ["6.4", "7.5", "9.1"] },
    { "id": 9, "tasks": ["9.2", "9.3", "10.1"] },
    { "id": 10, "tasks": ["9.4", "10.2", "10.3", "11.1"] },
    { "id": 11, "tasks": ["10.4", "11.2", "11.3"] },
    { "id": 12, "tasks": ["11.4", "12.1", "12.2"] },
    { "id": 13, "tasks": ["12.3"] },
    { "id": 14, "tasks": ["12.4"] }
  ]
}
```
