#!/bin/bash

echo "🔧 Fixing Node.js Compatibility Issue"
echo "======================================"
echo ""

# Check if nvm is installed
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "✅ nvm is installed"
    source "$HOME/.nvm/nvm.sh"
    
    echo ""
    echo "Installing Node.js 18 (compatible with macOS 11.6)..."
    nvm install 18
    nvm use 18
    nvm alias default 18
    
    echo ""
    echo "✅ Node.js installed successfully!"
    echo "Node version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo ""
    echo "You can now run: npm install"
    
elif command -v brew &> /dev/null; then
    echo "⚠️  nvm not found, but Homebrew is available"
    echo ""
    echo "To fix using Homebrew, run:"
    echo "  brew install node@18"
    echo "  brew link node@18"
    echo ""
    echo "Or install nvm first:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    
else
    echo "❌ Neither nvm nor Homebrew found"
    echo ""
    echo "Please install nvm:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo ""
    echo "Then restart your terminal and run this script again."
fi
