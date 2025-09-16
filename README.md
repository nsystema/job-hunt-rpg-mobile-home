# Job Hunt RPG Mobile

A mobile-first React Native (Expo SDK 53) experience that turns your job hunt into an RPG loop. Track applications, chase quests, open reward chests, and shop for temporary boosts-all optimized for Expo Go.

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```
2. Launch the Expo dev server
   ```bash
   npx expo start
   ```
3. Scan the QR code with the Expo Go app (iOS or Android) to play on your phone.

> Tip: Press `s` in the Expo CLI to switch between LAN/Tunnel modes if your device cannot reach the server on the local network.

## App structure

- `App.js` - Bottom tab navigation (Home, Applications, Quests, Rewards, Shop) and global providers.
- `src/context/GameContext.js` - Core RPG state machine (applications, quests, chests, boosts) with reusable actions.
- `src/screens/` - Feature screens built for touch-first interactions.
- `src/components/` - Presentational building blocks shared across screens.
- `src/utils/` & `src/data/` - Game mechanics, mock data, and formatting utilities.

## Features

- Log and edit job applications with streak-based XP and gold rewards.
- Quest system with claimable rewards and quick progress tracking.
- Chest inventory with randomised loot and a rewards shop for downtime treats.
- Boost shop providing temporary XP/gold multipliers and live timers.
- Mobile-friendly theming, quick actions, and safe-area-aware layout.

## Next steps

- Configure EAS project metadata in `app.json` before building standalone binaries.
- Connect the game state to persistent storage (e.g. AsyncStorage or backend) if you need cross-session progress.

