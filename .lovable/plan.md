

# Enhanced Shuttle Booking: Payment + QR Ticket Download

## What Exists
The shuttle booking flow already works: browse routes → select schedule → choose seat count → enter name/phone → confirm booking (inserts into `shuttle_bookings`). No login required.

## What to Add

### 1. Payment Step
Insert a **payment step** between guest info and confirmation. Two options:
- **Cash** — mark booking as confirmed immediately (default)
- **Wallet** — if user is logged in and has balance, deduct from wallet via `process_wallet_transaction` DB function
- **Midtrans/Xendit** — call `create-topup` style flow for direct shuttle payment (guest can pay without account)

New flow: Routes → Schedule → Seats → Guest Info → **Payment** → Confirmation

### 2. Database Changes (Migration)
- Add `payment_method` column to `shuttle_bookings` (text, nullable, values: `cash`, `wallet`, `midtrans`, `xendit`)
- Add `payment_status` column (text, default `unpaid`, values: `unpaid`, `paid`, `pending`)
- Update `shuttle_bookings` RLS: keep existing "anyone can insert" policy

### 3. QR Code Ticket with Download
- Install `qrcode.react` library for QR generation
- Create `src/components/shuttle/ShuttleTicket.tsx` — a printable ticket component containing:
  - PYU GO branding header
  - QR code encoding the `booking_ref`
  - Route name, departure time, seat count
  - Passenger name, phone
  - Total fare, payment status
- Add "Download Ticket" button on confirmation step
- Use `html2canvas` to capture the ticket as an image and trigger download as PNG

### 4. Updated Shuttle.tsx Flow
Add new step `"payment"` between `"guest_info"` and `"confirmation"`:
- Payment selection cards (Cash, Online Payment)
- For online: invoke edge function, handle redirect/popup
- For cash: proceed directly to confirmation
- On confirmation screen: show QR ticket + download button

### 5. New Edge Function: `create-shuttle-payment`
- Accepts `booking_id`, `amount`, `gateway`
- Creates Midtrans Snap token or Xendit Invoice for shuttle fare
- Returns payment token/URL
- Webhook (`payment-webhook`) updated to handle shuttle payment callbacks (update `shuttle_bookings.payment_status`)

### 6. Admin Dashboard Update
- Update `AdminShuttles.tsx` to show payment status column
- Add filter by payment status

## Technical Details
- **Libraries to install**: `qrcode.react`, `html2canvas`
- **New component**: `ShuttleTicket.tsx` (QR + booking details, styled for download)
- **New edge function**: `create-shuttle-payment`
- **Migration**: add `payment_method`, `payment_status` to `shuttle_bookings`
- **Updated files**: `Shuttle.tsx` (add payment step + ticket download), `payment-webhook/index.ts` (handle shuttle payments), `AdminShuttles.tsx` (payment status display)

## Implementation Order
1. Database migration (add payment columns)
2. Create `create-shuttle-payment` edge function
3. Update `payment-webhook` to handle shuttle bookings
4. Build `ShuttleTicket.tsx` with QR code
5. Update `Shuttle.tsx` with payment step + download ticket
6. Update `AdminShuttles.tsx` with payment info

