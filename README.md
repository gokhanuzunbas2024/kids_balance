# Kids' Activity Balance App

A Progressive Web App (PWA) that helps children (ages 6-12) develop healthy time management habits by logging completed activities and receiving visual feedback on their daily balance and activity quality.

## Features

- **Post-activity logging**: Log activities after completion (no live tracking)
- **Quality-weighted scoring**: Activities have coefficient multipliers (1.0-5.0) that weight their contribution to daily quality scores
- **Positive reinforcement**: Non-judgmental feedback encourages balanced habits
- **Simple UX**: Maximum 3 taps to log an activity
- **Balance Dashboard**: Visual feedback on daily activity balance
- **Parent Dashboard**: Manage activities and view statistics

## Tech Stack

- React 18+ with TypeScript
- Vite for build tooling
- Zustand for state management
- Dexie (IndexedDB) for local storage
- Recharts for data visualization
- Framer Motion for animations
- Tailwind CSS for styling
- PWA support with offline capabilities

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ActivityLogger/     # Activity logging components
│   ├── Dashboard/           # Balance dashboard components
│   ├── Parent/             # Parent management components
│   └── shared/             # Shared UI components
├── stores/                  # Zustand state management
├── db/                     # Database schema and seed data
├── utils/                  # Utility functions
├── types/                  # TypeScript type definitions
└── constants/              # App constants
```

## Development

The app uses:
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Vite** for fast development and building
- **PWA** support for offline functionality

## License

MIT
