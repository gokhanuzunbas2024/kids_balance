# Quick Deployment Guide

## Fastest Way: Vercel (5 minutes)

### Method 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then deploy to production
vercel --prod
```

### Method 2: Using GitHub + Vercel Web

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Vercel auto-detects Vite settings
6. Click "Deploy"
7. Done! Your app is live

## Before Deploying

### 1. Add PWA Icons

Create icons and place in `public/icons/`:
- `icon-192x192.png`
- `icon-512x512.png`
- `icon-180x180.png`

Generate at: https://realfavicongenerator.net/

### 2. Build Locally (Test First)

```bash
npm run build
npm run preview
```

Visit http://localhost:4173 to test production build.

### 3. Deploy

Choose your platform:

**Vercel:**
```bash
vercel --prod
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --prod
```

**GitHub Pages:**
```bash
npm install --save-dev gh-pages
# Add to package.json scripts: "deploy": "npm run build && gh-pages -d dist"
npm run deploy
```

## That's It!

Your app will be live at a URL like:
- `https://your-app.vercel.app` (Vercel)
- `https://your-app.netlify.app` (Netlify)
- `https://username.github.io/repo-name` (GitHub Pages)

## Test After Deployment

- [ ] App loads correctly
- [ ] Activities display
- [ ] Can log activities
- [ ] Works on mobile device
- [ ] PWA icons visible

---

**Need more details?** See `DEPLOYMENT.md` for comprehensive guide.
