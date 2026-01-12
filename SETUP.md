# Setup Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## PWA Icons

Before deploying, add PWA icons to `public/icons/`:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `icon-180x180.png` (180x180 pixels, for iOS)

You can generate these from a single image using:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Features Implemented

✅ Activity logging with 3-tap flow
✅ Quality-weighted scoring system (1.0-5.0 coefficients)
✅ Balance dashboard with visual feedback
✅ Category breakdown charts
✅ Badge system
✅ Parent dashboard for activity management
✅ Local storage with IndexedDB (Dexie)
✅ PWA configuration
✅ Responsive design with Tailwind CSS
✅ Animations with Framer Motion

## Next Steps

1. Add PWA icons (see above)
2. Customize preset activities in `src/constants/presetActivities.ts`
3. Adjust badge conditions in `src/constants/badges.ts`
4. Test on mobile devices
5. Deploy to hosting service (Vercel, Netlify, etc.)
