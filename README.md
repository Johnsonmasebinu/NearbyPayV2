# NearbyPay 💸

> **Send. Receive. Stay Close.** — a mobile-first payments app that makes sending money to the people around you as easy as a tap.

Built as a **hackathon project** 🔥

---

## 📖 About The Project

NearbyPay is a modern payments experience designed for closeness — sending money to friends, family, and people nearby without the friction of traditional banking apps.

Most payment apps are built around *accounts*. NearbyPay is built around *people*: quick sends, split bills, group payments, and a transaction history you can actually understand.

**Note:** This is a hackathon prototype — the UI and flows are fully built with mock data, ready to be wired to a payments API.

## ✨ Features

- 🪄 **Onboarding flow** — swipeable intro slides for first-time users
- 🔐 **Auth flow** — login, signup, and forgot-password screens
- 🏠 **Home dashboard** — animated balance card (with twinkling stars ✨), quick actions, and a promo card
- 📜 **Transaction history** — searchable, filterable (All / Sent / Received), grouped by day
- 🧾 **Transaction details** — bottom sheet with status, channel, reference, and receipt action
- 🔔 **Toast notification system** — success, error, info, and warning variants (light/dark aware)
- 🧭 **Custom bottom navigation** — 4 tabs with a floating gradient "Send" button
- 📱 **Pull-to-refresh** — on the dashboard and history screens
- 🌗 **Light & dark mode support** (system-aware toasts)

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | [React Native 0.86](https://reactnative.dev) + [Expo SDK 57](https://expo.dev) |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/), [React Native SVG](https://github.com/software-mansion/react-native-svg) |
| Icons | [Hugeicons](https://hugeicons.com) (react-native) |
| Typography | [Montserrat](https://fonts.google.com/specimen/Montserrat) via `@expo-google-fonts` |

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm (or yarn / pnpm)
- [Expo Go](https://expo.dev/go) app on your phone, or Xcode / Android Studio for simulators

### Installation

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd NearbyPay

# 2. Install dependencies
npm install

# 3. Start the dev server
npx expo start
```

Then scan the QR code with **Expo Go** (Android) or the Camera app (iOS), or press:

- `i` — open in iOS simulator
- `a` — open in Android emulator
- `w` — open in web browser

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm run web` | Start on web |
| `npm run lint` | Run ESLint |

## 📁 Project Structure

```
NearbyPay/
├── src/
│   ├── app/
│   │   ├── _layout.tsx        # Root layout: fonts, auth flow, providers
│   │   ├── index.tsx          # Home dashboard (balance, actions, recent txs)
│   │   └── explore.tsx        # Explore screen
│   ├── components/
│   │   ├── auth/              # Login, signup, forgot password
│   │   ├── ui/                # Toast system, collapsible
│   │   ├── app-tabs.tsx       # Authenticated tab shell
│   │   ├── onboarding.tsx     # First-run onboarding
│   │   └── transaction-history.tsx  # History screen + detail sheet
│   └── constants/             # Theme constants
├── assets/                    # Images, icons, splash
└── app.json                   # Expo configuration
```

## 🗺️ Roadmap

- [ ] Wire up a real payments backend / API
- [ ] Nearby device-to-device transfers (the "Nearby" in NearbyPay)
- [ ] Bill splitting with groups
- [ ] Biometric authentication
- [ ] Push notifications for payment alerts
- [ ] Dark mode for all screens

## 👥 Team

Built with ❤️ by the NearbyPay team as a hackathon project.

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<p align="center">Made with Expo ⚡</p>
