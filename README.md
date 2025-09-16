# Job Hunt RPG - React Native Mobile App (Expo SDK 53)

A gamified job hunting experience built with React Native and Expo. Track your job applications, earn XP and gold, and level up your career journey!

## Features

- **Gamified Job Tracking**: Log applications and earn rewards
- **Level System**: Gain XP and level up as you apply to jobs
- **Focus System**: Manage your energy for different types of applications
- **Multiple Themes**: Switch between light, dark, and system themes
- **Color Palettes**: Choose from various beautiful color schemes
- **Mobile Optimized**: Native mobile experience with smooth animations

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- NPM 9+
- Expo Go app on your mobile device with SDK 53 support

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. When the QR code appears, scan it with Expo Go (Android) or the Camera app (iOS). Ensure your Expo Go client is on SDK 53 to open the project.

### Running on Simulators

- **iOS Simulator**: `npx expo start --ios`
- **Android Emulator**: `npx expo start --android`

## Usage

1. **Log Applications**: Tap "Log application" to add new job applications
2. **Choose Application Type**: Select between "Full" (more XP/gold, costs more focus) or "Easy" (quick applications)
3. **Add Details**: Include company, role, and optional extras like CV tailoring
4. **Track Progress**: Watch your XP and level grow as you apply to more jobs
5. **Manage Focus**: Your focus regenerates over time - use it wisely!

## Game Mechanics

- **XP System**: Earn experience points for each application
- **Gold Currency**: Collect gold for future shop features
- **Focus/Stamina**: Limited energy that regenerates daily
- **Quality Bonuses**: Get extra rewards for tailored CVs and motivation letters
- **Level Progression**: Unlock new features as you level up

## Customization

- **Themes**: Toggle between light, dark, and system themes
- **Color Palettes**: Cycle through beautiful color schemes including Pastel, Ocean, Sunset, Forest, Lavender, and more

## Technical Details

- **Framework**: React Native with Expo
- **UI**: Native components with custom styling
- **Animations**: Smooth transitions and micro-interactions
- **State Management**: React hooks and local state
- **Persistence**: AsyncStorage for saving progress (to be implemented)

## Future Features

- Data persistence across app restarts
- Statistics and analytics
- Achievement system
- Social features
- Export functionality

## Contributing

This is a prototype/demo app. Feel free to fork and extend with additional features!

## License

MIT License - feel free to use this code for your own projects.