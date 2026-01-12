#!/bin/bash

echo "🔧 Removing Incompatible Node.js"
echo "================================="
echo ""
echo "This will remove the incompatible Node.js installation."
echo "You'll need to install a compatible version afterward."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing incompatible Node.js..."
    
    # Remove Node.js binaries
    sudo rm -f /usr/local/bin/node
    sudo rm -f /usr/local/bin/npm
    sudo rm -f /usr/local/bin/npx
    
    # Remove Node.js directories if they exist
    sudo rm -rf /usr/local/lib/node_modules 2>/dev/null
    sudo rm -rf /usr/local/include/node 2>/dev/null
    
    echo "✅ Incompatible Node.js removed"
    echo ""
    echo "Next steps:"
    echo "1. Install nvm:"
    echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo ""
    echo "2. Restart your terminal or run:"
    echo "   export NVM_DIR=\"\$HOME/.nvm\""
    echo "   [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\""
    echo ""
    echo "3. Install Node.js 18:"
    echo "   nvm install 18"
    echo "   nvm use 18"
    echo ""
    echo "4. Then run: npm install"
else
    echo "Cancelled."
fi
