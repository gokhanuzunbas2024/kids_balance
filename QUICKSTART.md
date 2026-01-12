# Quick Start Guide

## Prerequisites

- Node.js 18+ and npm installed
- A modern web browser

## Installation & Running

### Option 1: Using the setup script (macOS/Linux)

```bash
./scripts/setup.sh
npm run dev
```

### Option 2: Manual setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## What to Expect

1. **First Launch**: The app will automatically seed the database with preset activities
2. **Log Tab**: Tap activities to log them (maximum 3 taps)
3. **Dashboard Tab**: View your daily balance score and statistics
4. **Parent Tab**: Manage activities and view weekly trends

## Adding PWA Icons

Before deploying, add icons to `public/icons/`:
- `icon-192x192.png` (192x192)
- `icon-512x512.png` (512x512)  
- `icon-180x180.png` (180x180, for iOS)

Generate icons at:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Building for Production

```bash
npm run build
npm run preview
```

The built files will be in the `dist/` directory.

## Troubleshooting

### Port already in use
If port 5173 is busy, Vite will automatically use the next available port.

### Database issues
The app uses IndexedDB. If you encounter issues:
- Clear browser cache/local storage
- Check browser console for errors

### TypeScript errors
Run type checking:
```bash
npx tsc --noEmit
```

## Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Start dev server (`npm run dev`)
3. ⏳ Add PWA icons (see above)
4. ⏳ Test on mobile devices
5. ⏳ Deploy to hosting (Vercel, Netlify, etc.)
