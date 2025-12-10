#!/bin/bash

# Deploy StegHider to Vercel

echo "🚀 Deploying StegHider to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Run: vercel login"
    exit 1
fi

# Create vercel.json if it doesn't exist
if [ ! -f vercel.json ]; then
    cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ],
  "functions": {
    "app.py": {
      "maxDuration": 30
    }
  }
}
EOF
    echo "✅ Created vercel.json"
fi

# Create requirements.txt if it doesn't exist
if [ ! -f requirements.txt ]; then
    cat > requirements.txt << EOF
Flask==2.3.3
Pillow==10.0.0
cryptography==41.0.4
reedsolo==1.6.0
EOF
    echo "✅ Created requirements.txt"
fi

# Deploy
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app should be live at the URL shown above"
echo "🔧 Don't forget to set up your paid tiers and user authentication next!"