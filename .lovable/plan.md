
# PYU GO — Super App MVP Plan

## Overview
Build **PYU GO** as a mobile-first React PWA with two main modules (on-demand ride & shuttle booking), an admin dashboard, and a Supabase backend. The uploaded logos will be used as app branding.

---

## Phase 1: Foundation & Auth

- **Project structure**: Feature-based folder organization (`src/features/ride`, `src/features/shuttle`, `src/features/admin`, `src/shared`)
- **Branding**: Embed PYU GO logos, set up color palette (blue-to-green gradient from logo), typography
- **Auth system** (Supabase Auth):
  - Email/password login for registered users (riders)
  - Guest mode for shuttle booking (no login required)
  - Admin login with role-based access (user_roles table)
- **Database schema**: Users, profiles, roles, vehicles, drivers, rides, shuttle_routes, shuttle_schedules, shuttle_bookings, shuttle_seats

## Phase 2: Map & Ride Module

- **Leaflet/OSM map** as the primary UI (map-first design)
- **Ride request flow**:
  - Pick-up & drop-off location selection on map with geocoding
  - Fare estimation (edge function for pricing logic)
  - Ride request submission → stored in DB with realtime status
- **Ride status tracking**: Pending → Accepted → In Progress → Completed/Cancelled
- **Live driver location**: Supabase Realtime channel for driver position updates displayed on map
- **Bottom navigation**: Home (Map), Activity, Account

## Phase 3: Shuttle Module

- **Shuttle routes & schedules**: Browse available routes with departure times
- **Seat booking**: Select schedule → choose seats → confirm booking (guest or logged-in)
- **Booking confirmation**: Summary with booking reference number
- **Guest checkout**: Name + phone number only, no account required

## Phase 4: Admin Dashboard

- **Separate `/admin` route** with role-based protection
- **Dashboard overview**: Active rides, today's shuttle bookings, revenue stats
- **Ride management**: View all rides, statuses, assign drivers manually
- **Shuttle management**: CRUD for routes, schedules, seat configurations
- **Driver management**: Add/edit drivers, view activity
- **User management**: View registered users

## Phase 5: Edge Functions & Realtime

- **Pricing edge function**: Distance-based fare calculation using coordinates
- **Dispatch edge function**: Auto-assign nearest available driver to ride request
- **Realtime subscriptions**: Ride status changes, driver location updates

## Technical Stack
- React + TypeScript + Tailwind CSS
- Leaflet + React-Leaflet for maps
- Supabase (Auth, Postgres, Realtime, Edge Functions, RLS)
- React Router for navigation
- TanStack Query for data fetching
- Zustand for client state management (React alternative to Riverpod)

## UI/UX
- Mobile-first, map-centric design
- PYU GO branding (blue-green gradient theme)
- Bottom tab navigation (Home, Rides, Shuttle, Profile)
- Clean, modern super-app feel inspired by Gojek/Grab
