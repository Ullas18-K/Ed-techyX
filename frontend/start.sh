#!/bin/bash

echo "🎨 Starting Ed-TechyX Frontend..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env created. Please edit it with your configuration."
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting development server on http://localhost:8080"
npm run dev
