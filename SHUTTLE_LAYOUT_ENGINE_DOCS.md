# Seat Layout Builder Engine API Documentation

## Overview
The Seat Layout Builder Engine provides a way to create, manage, and render interactive seat layouts for various vehicle types in the shuttle system.

## Database Schema

### `shuttle_vehicle_layouts`
| Column | Type | Description |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `vehicle_type` | TEXT | Type of vehicle (SUV, HIACE, etc.) |
| `name` | TEXT | Name of the layout template |
| `description` | TEXT | Optional description |
| `dimensions` | JSONB | `{ width: number, height: number }` |
| `layout_data` | JSONB | Contains `seats` and `objects` arrays |
| `is_active` | BOOLEAN | Whether the layout is active |

### `layout_data` JSON Structure
```json
{
  "seats": [
    {
      "id": "string",
      "number": "string",
      "x": number,
      "y": number,
      "type": "Passenger | Driver | Baggage",
      "class": "VIP | Regular | Executive",
      "price_modifier": number
    }
  ],
  "objects": [
    {
      "id": "string",
      "type": "string",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "label": "string"
    }
  ]
}
```

## Service: `ShuttleLayoutService`

### `getLayouts()`
Fetches all available layout templates.

### `getLayoutById(id: string)`
Fetches a specific layout by its ID.

### `createLayout(layout: VehicleLayout)`
Creates a new layout template.

### `updateLayout(id: string, layout: Partial<VehicleLayout>)`
Updates an existing layout template.

### `deleteLayout(id: string)`
Deletes a layout template.

### `getActiveLayoutByVehicleType(vehicleType: string)`
Fetches the active layout for a specific vehicle type.

## Components

### `SeatLayoutBuilder` (Admin)
An interactive canvas-based editor for admins to design vehicle layouts.
- **Features**:
  - Drag-and-drop positioning
  - Grid snapping (10px)
  - Toolset for adding seats, baggage, and other objects
  - Properties panel for editing seat classes and numbers
  - Vehicle type categorization

### `SeatLayout` (User)
A responsive component that renders the designed layout for users to select seats.
- **Features**:
  - High-precision absolute positioning
  - Color-coded seat classes (VIP: Blue, Executive: Green, Regular: Gray)
  - Real-time status updates (via Supabase Realtime)
  - Responsive design for mobile and desktop

## Integration with Booking System
1. Layouts are linked to `shuttle_schedules` via `layout_id`.
2. If `layout_id` is null, the system falls back to the active layout for the schedule's `vehicle_type`.
3. If no dynamic layout is found, it falls back to legacy hardcoded layouts.
