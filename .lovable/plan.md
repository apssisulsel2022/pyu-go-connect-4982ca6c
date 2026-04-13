

# Analisis Komprehensif Aplikasi PYU GO

## Overview
PYU GO adalah super app transportasi (ride-hailing, shuttle, hotel) dengan 3 panel: User App (React), Driver Panel (React + Flutter), dan Admin Panel (React). Backend menggunakan Lovable Cloud dengan 10 Edge Functions.

---

## A. BUILD ERRORS (Harus Segera Diperbaiki)

### 1. VehicleInfo.tsx — `variant="white"` tidak valid
Baris 223 & 231 menggunakan `variant="white"` yang tidak ada di Button component. Harus diganti ke `variant="ghost"` atau `variant="outline"`.

### 2. Edge Functions — Tidak ada build error aktual
Pesan "Check supabase/functions/..." adalah info, bukan error. Functions sudah ter-deploy.

---

## B. SECURITY ISSUES (Kritis)

### 1. Role assignment dari client-side (KRITIS)
Di `useAuth.ts` baris 80-96, user bisa meng-assign role sendiri setelah signup:
```typescript
await supabase.from("user_roles").insert({
  user_id: data.user.id,
  role: "moderator" // atau "user"
});
```
Ini adalah **privilege escalation vulnerability**. Meski ada RLS policy "Users can insert own role", user bisa memodifikasi request untuk insert role "admin". **Solusi**: Role assignment harus dilakukan di database trigger (`handle_new_user`) atau Edge Function, bukan di client.

### 2. `dispatch-driver` — Tidak ada auth check
Edge function `dispatch-driver` menggunakan service role key tanpa memverifikasi caller. Siapapun bisa memanggil endpoint ini.

### 3. `audit_logs` — Tidak bisa INSERT
Tabel `audit_logs` tidak punya INSERT RLS policy untuk authenticated users, tapi trigger `log_driver_changes()` menggunakan `SECURITY DEFINER` jadi tetap bisa insert. Ini sebenarnya OK.

### 4. `process-ride-payment` — Tidak verifikasi caller identity
Function hanya check `authHeader` exists tapi tidak memverifikasi siapa yang memanggil. Harus memastikan caller adalah admin atau system.

---

## C. FUNCTIONAL BUGS

### 1. Driver Registration Stuck
Alur signup driver di `useAuth.ts`:
1. `signUp()` → create auth user
2. Insert `profiles` (via trigger `handle_new_user`)
3. Insert `drivers` table ← **BISA GAGAL** jika email belum confirmed (session null → no auth.uid() → RLS block)
4. Insert `user_roles` ← **JUGA GAGAL**

**Solusi**: Pindahkan pembuatan driver record dan role ke database trigger atau Edge Function yang menggunakan service role.

### 2. `wallet_type` enum mismatch
Di `Wallet.tsx` dan `DriverWallet.tsx`, wallet auto-create dilakukan via client. Jika enum `wallet_type` tidak cocok, insert akan gagal. Harus dipastikan enum values match.

### 3. Admin Login Redirect — Double query
Di `Auth.tsx` baris 29-33, setelah `signIn` berhasil, ada query tambahan ke `user_roles` untuk redirect. Ini redundan karena `useAuth` hook sudah fetch role via `onAuthStateChange`.

---

## D. CODE QUALITY ISSUES

### 1. Shuttle.tsx — 901 baris
File terlalu besar, harus dipecah ke komponen terpisah (RouteSelector, DatePicker, SeatSelector, PaymentForm, ConfirmationView).

### 2. `as any` overuse
Banyak penggunaan `as any` di:
- `AdminDrivers.tsx` baris 57, 119
- `DriverDashboard.tsx` baris 60
- `DriverWallet.tsx` baris 101
- `AdminWithdrawals.tsx` baris 185, 357

### 3. Missing error boundaries
Tidak ada React Error Boundary. Jika query gagal, app bisa crash.

### 4. Duplikasi kode
- `haversineKm()` diduplikasi di `calculate-fare/index.ts` dan `dispatch-driver/index.ts`
- Wallet auto-create logic diduplikasi di `Index.tsx`, `Wallet.tsx`, dan `DriverWallet.tsx`
- `fmt()` number formatter diduplikasi di 5+ files

---

## E. UX/UI ISSUES

### 1. Bahasa tidak konsisten
Campuran Indonesia dan English di seluruh app:
- Auth page: "Sign In", "Full Name" (English)
- Driver auth: "Nama Lengkap", "Masuk Sekarang" (Indonesia)
- Admin: Mix "Withdrawal Requests" (English title) + "Menunggu" (Indonesia content)

### 2. Guest checkout shuttle tanpa auth
`shuttle_bookings` RLS punya `INSERT WITH CHECK (true)` — siapapun bisa insert. Ini by design untuk guest booking tapi tidak ada rate limiting.

### 3. No pagination
Admin pages (drivers, rides, withdrawals) hanya limit 100 tanpa pagination. Akan bermasalah saat data bertambah.

---

## F. PERFORMANCE

### 1. Admin stats query fetches all rows
`AdminWithdrawals.tsx` baris 89-103 fetches ALL withdrawal_requests just to count by status. Harus menggunakan `count` atau database function.

### 2. Realtime channels
Multiple components subscribe ke realtime tanpa cleanup yang konsisten. Channel naming bisa bentrok.

---

## G. RENCANA PERBAIKAN (Prioritas)

### Phase 1 — Critical (Build + Security)
1. **Fix VehicleInfo.tsx** — Ganti `variant="white"` → `variant="ghost"`
2. **Fix role assignment** — Pindahkan ke `handle_new_user` trigger dengan default role
3. **Fix driver registration** — Buat driver record via trigger/edge function, bukan client
4. **Add auth to dispatch-driver** — Verifikasi caller

### Phase 2 — Functional
5. **Konsistensi bahasa** — Standarisasi ke Bahasa Indonesia
6. **Refactor Shuttle.tsx** — Pecah menjadi 5-6 komponen
7. **Tambah pagination** — Admin pages

### Phase 3 — Quality
8. **Error boundaries** — Tambah global + per-route
9. **Hapus `as any`** — Type properly
10. **Extract shared utils** — `haversineKm`, `fmt`, wallet auto-create

---

## Technical Details

### Migration untuk fix role assignment:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Auto-assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;
```

### Files yang perlu diubah (Phase 1):
- `src/components/driver/profile/VehicleInfo.tsx` — fix variant
- `src/hooks/useAuth.ts` — remove client-side role insert
- `supabase/functions/dispatch-driver/index.ts` — add auth check
- 1 database migration — update `handle_new_user` trigger

Apakah Anda ingin saya mulai dari Phase 1 (critical fixes)?

