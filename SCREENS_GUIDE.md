# NearbyPay — Screens Build Guide (Frontend → Backend Handoff)

> Goal: you build ALL screens with mock data + clean contracts, your partner plugs the backend without rewriting UI.
> Current stack: Expo ~57, React Native 0.86, expo-router (file-based, currently bypassed), TypeScript strict, Montserrat, HugeIcons, Reanimated, SVG.

---

## 1. What's already done (don't rebuild)

- `src/components/onboarding.tsx` — 3 slides, OK
- `src/components/auth/login-screen.tsx` — rebuilt: SafeAreaContext + KeyboardAvoiding + card UI
- `src/components/auth/signup-screen.tsx` — rebuilt to match login
- `src/components/auth/forgot-password-screen.tsx` — rebuilt to match login
- `src/app/index.tsx` — Home dashboard (balance card, quick actions, promo, recent 3)
- `src/components/transaction-history.tsx` — history list + detail bottom-sheet
- `src/components/ui/toast.tsx` — global toast

---

## 2. What's wrong — fix before building more

Be honest, these will bite your partner if ignored:

1. **No real navigation.** `src/app/_layout.tsx` uses `useState(showOnboarding/isAuthenticated/authView)` and `src/components/app-tabs.tsx` just returns `<HomeScreen/>`. expo-router is installed but bypassed. No deep links, no back-button, no web routes, `explore.tsx` is dead code.
   → Fix: move to real file routes (see §4).

2. **All data is hardcoded.** `TRANSACTIONS` in `index.tsx`, `HISTORY_TX` in `transaction-history.tsx`, user `Chinedu Okafor / ₦245,680.75`. No `src/data/`, no `src/api/`, no shared types.
   → Fix: create `src/types/` + `src/data/mocks.ts` + `src/api/client.ts` stub now.

3. **Auth is fake.** `onLogin={() => setIsAuthenticated(true)}`, no validation, no loading, no errors, no persistence, no SecureStore/session.
   → Fix: add form validation + `isLoading` states now, leave `// TODO(api):` hooks.

4. **Brand colors are inconsistent.** `#2B20F0` (auth buttons) vs `#1E44F8` vs `#208AEF` (splash) vs `#2E55F7→#112CC9` (balance) vs `#3B66FF→#112CC9` (FAB). Pick ONE primary.
   → Recommendation: primary `#2B20F0`, gradient `#2E55F7→#112CC9`, page bg `#EEF3FC` light / `#020617` dark, card `#FFF` / `#0F172A`, border `#E4EAF6` / `#1E293B`. Update `src/constants/theme.ts`.

5. **Dark mode is half-done.** Home + history are light-only (`#EEF3FC`), auth/toast/onboarding are dark-aware. Decide: full dark or light-only.

6. **TS error breaks `npx tsc`.** `src/components/transaction-history.tsx:356` uses `styles.modalBackdrop` + `styles.modalOverlay` but they don't exist in StyleSheet. Fix before handoff.

7. **God files.** `index.tsx` 943 lines, `transaction-history.tsx` 796 lines. Split into `balance-card.tsx`, `quick-actions.tsx`, `promo-card.tsx`, `bottom-nav.tsx`, `tx-row.tsx`, `tx-sheet.tsx`.

8. **Template leftovers.** `src/app/explore.tsx`, `collapsible.tsx`, `hint-row.tsx`, `web-badge.tsx`, `external-link.tsx`, `scripts/reset-project.js`. Delete or move to `_archive/` if not demoing docs.

9. **Risky externals.** Avatar `https://cdn.jsdelivr.net/.../memo_23.png` in `index.tsx:263` — fails offline. Bundle a local avatar.

10. **No env / api / errors / tests.** No `.env`, no axios/fetch wrapper, no ErrorBoundary, no `npm run lint` in CI.

Fix 1, 2, 6 first — they block your partner.

---

## 3. Full screen list (build in this order)

### Phase A — Foundation (do first)
- [x] Onboarding
- [x] Login / Signup / Forgot
- [ ] **OTP Verify** — 6-box input, resend timer, `POST /auth/verify-otp`
- [ ] **New Password** — password + confirm + show/hide, `POST /auth/reset`

### Phase B — Tabs (real routes)
- [~] Home `/(tabs)/home` — extract from `index.tsx`, add skeleton loading, empty state
- [~] History `/(tabs)/history` — promote `transaction-history.tsx` to a route, add pagination
- [ ] **Send `/(tabs)/send`** — steps: 1) recipient (nearby/contacts/QR) 2) amount + note 3) confirm + PIN 4) success. `POST /transfers`
- [ ] **Receive `/(tabs)/receive`** — QR + amount request + share. `POST /requests`
- [ ] **Profile `/(tabs)/profile`** — avatar, name, KYC badge, settings links. `GET /me`

### Phase C — Stacks (push on top of tabs)
- [~] Transaction Detail sheet — exists, extract to `tx-sheet.tsx`, add `GET /transactions/:id`
- [ ] Receipt — share/download PDF, `GET /transactions/:id/receipt`
- [ ] Notifications — list, read/unread, `GET /notifications`
- [ ] Settings — theme, biometrics toggle, logout, `PATCH /me/preferences`
- [ ] Split Bill — create split, add members, totals. `POST /splits`
- [ ] Contacts / Nearby — mock nearby list now, BLE/NFC later

Minimum shippable for backend: OTP + New Password + Send (4 steps) + Receive + Profile + Notifications. Split/Groups can be v2.

---

## 4. Routing plan (expo-router)

Stop using `useState` nav. Use this:

```
src/app/
  _layout.tsx            // ThemeProvider + ToastProvider + <Stack>
  (onboarding)/index.tsx // <Onboarding/>
  (auth)/login.tsx       // <LoginScreen/>
  (auth)/signup.tsx
  (auth)/forgot.tsx
  (auth)/otp.tsx         // NEW
  (auth)/new-password.tsx// NEW
  (tabs)/_layout.tsx     // <Tabs> Home/History/Send/Receive/Profile
  (tabs)/home.tsx
  (tabs)/history.tsx
  (tabs)/send.tsx
  (tabs)/receive.tsx
  (tabs)/profile.tsx
  tx/[id].tsx            // detail
  receipt/[id].tsx
  notifications.tsx
  settings.tsx
```

`_layout.tsx` logic becomes:
```ts
if (!onboardingDone) <Redirect href="/(onboarding)" />
if (!session) <Redirect href="/(auth)/login" />
else <Redirect href="/(tabs)/home" />
```

Keep `activeTab` custom bottom nav if you like the FAB look, but drive it with `useRouter()` / `useSegments()`.

---

## 5. Folder + contracts for your partner

```
src/
  types/index.ts        // User, Wallet, Transaction, ApiError — SINGLE SOURCE OF TRUTH
  data/mocks.ts         // TRANSACTIONS, HISTORY_TX, USER move here
  api/client.ts         // fetch wrapper with // TODO(api) stubs
  api/auth.ts           // login/signup/otp/reset (stubbed, returns mocks)
  api/wallet.ts         // balance, transfers
  api/transactions.ts
  hooks/use-session.ts  // { session, login(), logout() } — SecureStore later
  components/...        // dumb UI only, props in, callbacks out
```

Copy-paste types to start with:

```ts
export type User = { id: string; name: string; email: string; avatar?: string; kycVerified: boolean };
export type Wallet = { balanceMinor: number; currency: 'NGN' };
export type Transaction = {
  id: string; title: string; category: string; amountMinor: number;
  type: 'sent'|'received'; status: 'Completed'|'Pending'|'Failed';
  reference: string; channel: string; createdAt: string;
};
export type SendInput = { toUserId: string; amountMinor: number; note?: string; pin?: string };
```

Every screen that needs backend gets this header comment:
```ts
// TODO(api): replace mock with api.wallet.send(SendInput)
// Expected: POST /transfers { toUserId, amountMinor, note } -> Transaction
// Errors: 400 INVALID_AMOUNT, 401 UNAUTHORIZED, 402 INSUFFICIENT_FUNDS
```

---

## 6. Backend endpoint checklist (give this to your partner)

```
POST /auth/signup { name, email, password } -> { user, otpToken }
POST /auth/login { email, password } -> { token, user }
POST /auth/forgot { email } -> { otpToken }
POST /auth/verify-otp { otpToken, code } -> { resetToken }
POST /auth/reset { resetToken, password } -> { token }
GET  /me -> User
GET  /wallet -> Wallet
GET  /transactions?limit&cursor&query&type -> { items: Transaction[], nextCursor? }
GET  /transactions/:id -> Transaction
GET  /transactions/:id/receipt -> { pdfUrl }
POST /transfers { toUserId, amountMinor, note } -> Transaction
POST /requests { amountMinor, note } -> { qrPayload }
GET  /notifications -> Notification[]
```

Auth: Bearer token, store in `expo-secure-store` (not AsyncStorage).

---

## 7. UI rules (so all screens look like login/signup)

- Page bg `#EEF3FC` / `#020617`, card `#FFF` / `#0F172A`, border `#E4EAF6` / `#1E293B`
- Font Montserrat only: 700 titles 26-28, 400 subtitle 13.5/20, 600 label 13, 500 input 14
- Inputs: 52px height, 14px radius, 1.5px border, icon left 18px, focus border `#2B20F0`, show/hide eye for passwords
- Buttons: 54px height, 16px radius, `#2B20F0`, white 15/700 text
- Layout: `SafeAreaView (safe-area-context) > KeyboardAvoidingView > ScrollView flexGrow:1 justifyContent:center > View maxWidth:420 self:center padding 20/24`
- Never import `SafeAreaView` from `react-native` (deprecated — you already hit this)
- Toasts: success/error/info only, no `alert()`
- Money: store minor units (kobo), format with `Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN'})`

---

## 8. Definition of done per screen

- [ ] Fits 360x640 small phone, no overflow, keyboard never covers input
- [ ] Light + dark correct (or explicitly light-only)
- [ ] Loading + empty + error states (not just happy path)
- [ ] `// TODO(api)` with endpoint + shape
- [ ] `tsc --noEmit` clean, `expo lint` clean for touched files
- [ ] Uses `useToast()` for feedback, `useRouter()` for nav (no `useState` page switching)

Build order: OTP → New Password → fix router → extract mocks/types → Send → Receive → Profile → Notifications → Detail/Receipt → Split.

Do that and your partner can connect endpoints file-by-file without touching UI.
