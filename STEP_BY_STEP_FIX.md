# Step-by-Step Fix for Node.js Compatibility Issue

## The Problem
Your Node.js was built for macOS 13.5, but you're running macOS 11.6.0. This causes a library compatibility error.

## Solution: Step-by-Step Instructions

### Step 1: Remove Incompatible Node.js

**Option A: Using the script (recommended)**
```bash
cd /Users/gokhanuzunbas/Documents/Developer/CursorProjects
./scripts/remove-incompatible-node.sh
```

**Option B: Manual removal**
```bash
sudo rm /usr/local/bin/node
sudo rm /usr/local/bin/npm
sudo rm /usr/local/bin/npx
```

### Step 2: Install nvm (Node Version Manager)

Run this command in your terminal:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### Step 3: Load nvm in Your Current Terminal

After installing nvm, run:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

**OR** restart your terminal (close and reopen it).

### Step 4: Verify nvm is Working

```bash
nvm --version
```

You should see a version number (e.g., `0.39.0`).

### Step 5: Install Node.js 18 (Compatible with macOS 11.6)

```bash
nvm install 18
nvm use 18
nvm alias default 18
```

### Step 6: Verify Node.js is Working

```bash
node --version
npm --version
```

You should see:
- `v18.x.x` (or similar)
- `9.x.x` or `10.x.x` for npm

### Step 7: Install Project Dependencies

```bash
cd /Users/gokhanuzunbas/Documents/Developer/CursorProjects
npm install
```

### Step 8: Start Development Server

```bash
npm run dev
```

## Troubleshooting

### If nvm command not found after installation:

Add this to your `~/.zshrc` file:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

Then reload:
```bash
source ~/.zshrc
```

### If you get permission errors:

Make sure you're using `sudo` only when removing files, not when installing nvm or Node.js via nvm.

### Alternative: Use Homebrew

If you prefer Homebrew:
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 18
brew install node@18
brew link node@18
```

## Quick Command Summary

```bash
# 1. Remove incompatible Node.js
sudo rm /usr/local/bin/node /usr/local/bin/npm /usr/local/bin/npx

# 2. Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 3. Load nvm (or restart terminal)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 4. Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# 5. Install project dependencies
cd /Users/gokhanuzunbas/Documents/Developer/CursorProjects
npm install

# 6. Start dev server
npm run dev
```
