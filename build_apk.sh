#!/usr/bin/env bash
# FoodFax Shop Partner - 1-Click APK Build Script
# Run this script in your terminal: bash build_apk.sh

set -e

echo "=========================================="
echo "🚀 Building FoodFax Shop Partner APK"
echo "=========================================="

echo "📦 1. Fetching Flutter dependencies..."
flutter pub get

echo "🧹 2. Cleaning previous build cache..."
flutter clean
flutter pub get

echo "🔨 3. Compiling Release APK (with validation bypass for Gradle 8.14)..."
flutter build apk --release --android-skip-build-dependency-validation

echo ""
echo "=========================================="
echo "✅ APK Build Succeeded!"
echo "📍 APK Location:"
echo "   build/app/outputs/flutter-apk/app-release.apk"
echo "=========================================="
