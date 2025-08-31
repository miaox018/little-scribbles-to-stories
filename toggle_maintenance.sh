#!/bin/bash

# Toggle Maintenance Mode Script for StoryMagic
# This script helps quickly enable/disable maintenance mode

echo "🔧 StoryMagic Maintenance Mode Toggle"
echo "===================================="

# Function to set maintenance mode
enable_maintenance() {
    echo "🚨 Enabling maintenance mode..."
    
    # For local development
    if grep -q "VITE_MAINTENANCE_MODE" .env.local 2>/dev/null; then
        sed -i '' 's/VITE_MAINTENANCE_MODE=.*/VITE_MAINTENANCE_MODE=true/' .env.local
    else
        echo "VITE_MAINTENANCE_MODE=true" >> .env.local
    fi
    
    echo "✅ Local environment updated"
    echo ""
    echo "📝 To apply to production (Vercel):"
    echo "1. Go to Vercel Dashboard → Project Settings → Environment Variables"
    echo "2. Set VITE_MAINTENANCE_MODE=true"
    echo "3. Redeploy the application"
    echo ""
    echo "🔒 Maintenance mode enabled!"
}

# Function to disable maintenance mode
disable_maintenance() {
    echo "✅ Disabling maintenance mode..."
    
    # For local development
    if grep -q "VITE_MAINTENANCE_MODE" .env.local 2>/dev/null; then
        sed -i '' 's/VITE_MAINTENANCE_MODE=.*/VITE_MAINTENANCE_MODE=false/' .env.local
    else
        echo "VITE_MAINTENANCE_MODE=false" >> .env.local
    fi
    
    echo "✅ Local environment updated"
    echo ""
    echo "📝 To apply to production (Vercel):"
    echo "1. Go to Vercel Dashboard → Project Settings → Environment Variables"
    echo "2. Set VITE_MAINTENANCE_MODE=false (or delete the variable)"
    echo "3. Redeploy the application"
    echo ""
    echo "🚀 Maintenance mode disabled!"
}

# Check current status
check_status() {
    local status="disabled"
    if grep -q "VITE_MAINTENANCE_MODE=true" .env.local 2>/dev/null; then
        status="enabled"
    fi
    echo "Current maintenance mode status: $status"
}

# Main menu
echo ""
check_status
echo ""
echo "What would you like to do?"
echo "1) Enable maintenance mode"
echo "2) Disable maintenance mode" 
echo "3) Check current status"
echo "4) Exit"
echo ""
read -p "Please select an option (1-4): " choice

case $choice in
    1)
        enable_maintenance
        ;;
    2)
        disable_maintenance
        ;;
    3)
        check_status
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option. Please select 1-4."
        exit 1
        ;;
esac

echo ""
echo "🔧 Note: Admins can always bypass maintenance mode using the admin override button."