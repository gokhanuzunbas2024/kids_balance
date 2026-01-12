# Deployment Guide - Kids Activity Balance App

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git (for version control and deployment)

## Step 1: Build for Production

Build the optimized production version:

```bash
npm run build
```

This creates a `dist/` directory with optimized, minified files ready for deployment.

## Step 2: Preview Production Build Locally

Before deploying, test the production build locally:

```bash
npm run preview
```

This serves the production build at `http://localhost:4173` (or next available port).

## Step 3: Add PWA Icons (Required)

Before deploying, add PWA icons to `public/icons/`:

- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `icon-180x180.png` (180x180 pixels, for iOS)

**Generate icons:**
- Use https://realfavicongenerator.net/
- Or https://www.pwabuilder.com/imageGenerator
- Upload a square image (at least 512x512) and download the generated icons

**Place them in:**
```
public/icons/
  ├── icon-192x192.png
  ├── icon-512x512.png
  └── icon-180x180.png
```

## Step 4: Choose Deployment Platform

### Option A: Vercel (Recommended - Easiest)

1. **Install Vercel CLI** (optional, or use web interface):
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```
   Follow the prompts. Vercel will auto-detect Vite settings.

3. **Or use GitHub integration:**
   - Push code to GitHub
   - Go to https://vercel.com
   - Import your repository
   - Vercel auto-deploys on every push

**Vercel Configuration:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Option B: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   netlify deploy --prod
   ```
   Or use the Netlify web interface with drag-and-drop.

3. **Or use GitHub integration:**
   - Push to GitHub
   - Go to https://app.netlify.com
   - New site from Git
   - Connect repository

**Netlify Configuration:**
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option C: GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json:**
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Select `gh-pages` branch
   - Your site will be at `https://username.github.io/repo-name`

### Option D: Traditional Web Server (Apache/Nginx)

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Upload `dist/` folder** to your web server

3. **Configure server** to serve `index.html` for all routes (SPA routing):
   
   **Nginx:**
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```
   
   **Apache (.htaccess):**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

## Step 5: Environment Variables (If Needed)

If you add environment variables later, create `.env.production`:

```env
VITE_APP_TITLE=Kids Activity Tracker
```

Then access in code: `import.meta.env.VITE_APP_TITLE`

## Step 6: Post-Deployment Checklist

- [ ] PWA icons added and visible
- [ ] App loads correctly
- [ ] Activities load and display
- [ ] Database (IndexedDB) works in browser
- [ ] Test on mobile device
- [ ] Test offline functionality (PWA)
- [ ] Check browser console for errors
- [ ] Verify HTTPS (required for PWA)

## Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### PWA Not Working
- Ensure site is served over HTTPS
- Check browser console for service worker errors
- Verify manifest.json is accessible

### Database Issues
- IndexedDB works per-domain
- Clear browser data if needed
- Check browser console for IndexedDB errors

## Quick Deploy Commands

```bash
# Build
npm run build

# Preview locally
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod
```

## Production URLs

After deployment, your app will be available at:
- **Vercel**: `https://your-app-name.vercel.app`
- **Netlify**: `https://your-app-name.netlify.app`
- **GitHub Pages**: `https://username.github.io/repo-name`

## Next Steps After Deployment

1. **Test on multiple devices** (phone, tablet, desktop)
2. **Share the link** with users
3. **Monitor usage** via analytics (optional)
4. **Set up custom domain** (optional)
5. **Enable automatic deployments** from Git

---

**Need help?** Check the console logs or deployment platform documentation.
