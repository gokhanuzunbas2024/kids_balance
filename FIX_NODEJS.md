# Fix Node.js Compatibility Issue

## Problem
Your Node.js was built for macOS 13.5 (Ventura) but you're running macOS 11.6.0 (Big Sur), causing a compatibility error.

## Solution: Install Node.js using nvm (Recommended)

### Step 1: Install nvm (if not already installed)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

Then restart your terminal or run:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### Step 2: Install Node.js 18 using nvm

```bash
# Install Node.js 18 (compatible with macOS 11.6)
nvm install 18

# Use Node.js 18
nvm use 18

# Set as default
nvm alias default 18

# Verify installation
node --version
npm --version
```

### Step 3: Install project dependencies

```bash
cd /Users/gokhanuzunbas/Documents/Developer/CursorProjects
npm install
```

## Alternative Solution: Reinstall Node.js via Homebrew

If you prefer not to use nvm:

```bash
# Remove incompatible Node.js
sudo rm /usr/local/bin/node
sudo rm /usr/local/bin/npm

# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js via Homebrew
brew install node@18

# Link Node.js
brew link node@18

# Verify
node --version
npm --version
```

## Quick Fix Script

I've created a script to help with this. Run:

```bash
./scripts/fix-nodejs.sh
```

## After Fixing

Once Node.js is working:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
