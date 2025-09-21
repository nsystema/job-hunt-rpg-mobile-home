# Jobless - React Native Mobile App (Expo SDK 53)

Gamified Job Application Tracker.

Jobless turns the grind of job hunting into an RPG-style progression loop. Log applications, monitor progress, pursue quests, and open treasure chests to keep motivation high while you search.

## Core Features

### Application logging & management
- Launch the log modal to capture company, role, application type (Full or Easy), status, platform, tailored CV and motivation toggles, favorite flag, notes, and location details for every opportunity. A live reward preview shows the XP, gold, and focus cost before you submit, and the form validates country/city selections using the built-in autocomplete data.
- Editing preserves historical rewards, updates quest metrics, and records favorite or status changes for export-ready timelines. Entries can be searched, filtered by status or platform, sorted, exported, duplicated, favorited, or deleted from the applications tab.

### Progress dashboard
- The Home tab highlights your current level, XP remaining to the next level, total applications logged, and available focus using animated progress bars.
- An activity snapshot summarises daily output, per-day average, active pipeline, reply rate, and interview rate while comparing the current week to the last with trend indicators and accessibility-friendly labels.

### Applications workspace
- Search as you type, toggle status or platform filters, and switch between newest, oldest, alphabetical, or favorites-first sorting to audit your pipeline. Each card displays status icons, quick stats, and action buttons for editing, duplicating, favoriting, or deleting.
- Export produces a JSON payload containing application history and detailed status timelines. On mobile the payload is shared through the native sheet; on web and other unsupported platforms it prints to the console with a user alert.

### Quest & event system
- Daily, Weekly, Growth, and Event quest tabs are generated dynamically from quest data and current metrics. Progress bars, tier summaries, stage checklists, and manual action hooks make it clear how to advance every quest.
- Claim quest rewards to receive gold, boosts, cleanses, or treasure chests. Event quests surface notifications when new rewards are available and automatically clear when events reset.

### Rewards vault
- Level-ups and quest rewards grant chests across Common, Rare, Epic, and Legendary rarities. The vault lets you filter by rarity, inspect chest art, open individually for animated results, or open all at once with a summary modal and toast notification of total gold gained.

### Shop & boosts
- Browse Active boosts, the general catalogue, and premium treats. Purchase temporary effects that double XP or gold, view remaining timers, and manage penalties like the Spray and Pray debuff alongside passive perks.
- Save gold toward premium rewards in flexible increments and confirm redemptions once fully funded. Real-world reward ideas are sorted by effective cost and can be redeemed directly from the shop.

### Theming & presentation
- Custom theme and palette hooks drive cohesive light and dark presentations with gradient-heavy surfaces, SVG chest art, and MaterialCommunityIcons throughout the interface.

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm 9+
- Expo Go app on a device (SDK 53 compatible) or an Android/iOS simulator

### Installation
1. Clone or download this project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npx expo start
   ```
4. Scan the QR code with Expo Go (Android) or the Camera app (iOS) when prompted.

### Tests & automation
- The repo includes a smoke test that spawns the Expo CLI and waits for readiness:
  ```bash
  npm run test
  ```
  Use it locally or in CI to validate the project boots with the configured SDK.

## Release configuration

Release builds reserve specific store identifiers for this project:

- **iOS bundle identifier:** `com.jobless.app`
- **Android application ID:** `com.jobless.app`

Coordinate any changes to these IDs with release engineering to avoid conflicts in the Apple Developer or Google Play Console accounts.

## Navigating the app
- **Home:** Monitor XP, focus, and activity stats while triggering the "Log application" action.
- **Apps:** Manage the pipeline with search, filters, sorting, editing, duplication, favorite toggles, status changes, notes, and exports.
- **Quests:** Review progression across daily habits, weekly targets, long-term growth goals, and time-limited events, then claim rewards when complete.
- **Rewards:** Inspect treasure chests, filter by rarity, and open them individually or in bulk for immediate gold payouts.
- **Shop:** Activate boosts, redeem treats, or save toward premium rewards while tracking active effect timers and penalties.

## Game mechanics
- Leveling uses a non-linear XP curve and exposes remaining XP via the `lvl` helper for accurate progress bars.
- Focus starts at a baseline of 20 points and each application type consumes stamina (`Full` costs 1 focus, `Easy` costs 0.5) with a minimum floor, so planning balanced workloads matters.
- Rewards scale with application effort: Full applications earn more XP/gold, tailoring the CV or adding a motivation letter boosts multipliers, streaks and active shop effects can double payouts, and the Spray and Pray penalty halves gains for six hours after spamming low-quality apps.
- Level-ups roll weighted chest rarities that improve as you progress, while quests and the shop introduce additional sources of boosts, gold, and penalties to keep the feedback loop engaging.

## Data & limitations
- All game state lives in memory via React state hooks. Reloading the app resets progress; persistence is a future enhancement under consideration.

## Contributing

This is an experimental prototype—feel free to fork it, explore new mechanics, or integrate persistence and backend services tailored to your job search workflow.

## License

MIT License – you are free to use this code for your own projects.
