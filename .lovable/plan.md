

# Payment & Wallet System with Midtrans + Xendit Integration

## Overview

Build a complete wallet and payment system for PYU GO with user wallets, driver wallets, top-up via Midtrans/Xendit, transaction history, and admin payment settings.

## Database Schema (Migration)

**New tables:**

1. **`wallets`** — One per user/driver
   - `id`, `user_id` (uuid, unique), `balance` (numeric, default 0), `wallet_type` (enum: `user`, `driver`), `created_at`, `updated_at`
   - RLS: users can view own wallet; admins can view all

2. **`wallet_transactions`** — Ledger of all wallet movements
   - `id`, `wallet_id` (references wallets), `type` (enum: `top_up`, `ride_payment`, `ride_earning`, `withdrawal`, `refund`, `admin_adjustment`), `amount` (numeric), `balance_after` (numeric), `reference_id` (text, nullable — ride_id or payment gateway ref), `description` (text), `status` (enum: `pending`, `completed`, `failed`), `payment_gateway` (text, nullable — `midtrans` or `xendit`), `gateway_transaction_id` (text, nullable), `created_at`
   - RLS: users can view own transactions; admins can view all

3. **`payment_settings`** — Admin-configurable gateway settings
   - `id`, `gateway` (text — `midtrans` or `xendit`), `is_active` (boolean), `is_default` (boolean), `config` (jsonb — stores non-secret config like environment mode), `created_at`, `updated_at`
   - RLS: admins only

**New enums:** `wallet_type`, `transaction_type`, `transaction_status`

**Database function:** `process_wallet_transaction` — atomic balance update + transaction insert to prevent race conditions.

Enable realtime on `wallets` and `wallet_transactions`.

## Edge Functions

1. **`create-topup`** — Initiates a top-up:
   - Validates amount, checks active payment gateway from `payment_settings`
   - Calls Midtrans Snap API or Xendit Invoice API to create a payment
   - Inserts a `pending` transaction, returns payment URL/token to frontend

2. **`payment-webhook`** — Handles callbacks from both gateways:
   - Verifies webhook signature (Midtrans server key / Xendit callback token)
   - On success: updates transaction status to `completed`, credits wallet balance
   - On failure: updates transaction to `failed`

3. **`process-ride-payment`** — Called when ride completes:
   - Deducts fare from rider wallet, credits driver wallet (minus platform commission)
   - Creates paired transactions for both wallets

## Secrets Required

User will need to provide:
- `MIDTRANS_SERVER_KEY` — Midtrans server key
- `MIDTRANS_CLIENT_KEY` — Midtrans client key (for Snap.js)
- `XENDIT_SECRET_KEY` — Xendit API key
- `XENDIT_WEBHOOK_TOKEN` — Xendit webhook verification token

## Frontend Pages

1. **`src/pages/Wallet.tsx`** — Main wallet page:
   - Balance card with top-up button
   - Transaction history list (filterable by type)
   - Top-up flow: amount input → gateway selection → redirect to payment page

2. **`src/components/wallet/TopUpDialog.tsx`** — Modal for selecting amount and gateway
3. **`src/components/wallet/TransactionList.tsx`** — Reusable transaction history component

3. **Bottom nav update** — Add Wallet icon between Shuttle and Profile

4. **Admin pages:**
   - **`src/pages/admin/AdminPayments.tsx`** — Payment gateway settings:
     - Toggle Midtrans/Xendit active status
     - Set default gateway
     - View all transactions across users
     - Manual wallet adjustments
   - Add "Payments" nav item to `AdminLayout.tsx`

## Routing

- Add `/wallet` route inside `AppLayout`
- Add `/admin/payments` route inside `AdminLayout`

## Technical Details

- Midtrans: Use Snap.js for frontend payment popup (load script dynamically)
- Xendit: Use Invoice API, redirect user to Xendit-hosted payment page
- Wallet balance updates use a database function with `FOR UPDATE` row locking
- All monetary values in IDR (Rp), stored as numeric
- Commission rate stored in `payment_settings` config JSON

