#!/bin/bash

# Test script for Vigilant monitoring system
# This script tests the unified watcher system

echo "🧪 Testing Vigilant Unified Watcher System"
echo "========================================="
echo ""

# Test ping endpoint
echo "1. Testing Ping Endpoint..."
echo "---------------------------"
curl -s http://localhost:8000/api/test/ping | jq '.' 2>/dev/null || curl -s http://localhost:8000/api/test/ping
echo ""
echo ""

# Test cookie endpoint
echo "2. Testing Cookie Endpoint..."
echo "----------------------------"
curl -s http://localhost:8000/api/test/cookie-teste | jq '.' 2>/dev/null || curl -s http://localhost:8000/api/test/cookie-teste
echo ""
echo ""

# Test setup endpoint
echo "3. Testing Setup Endpoint..."
echo "---------------------------"
curl -s -X POST http://localhost:8000/api/setup/initialize | jq '.' 2>/dev/null || curl -s -X POST http://localhost:8000/api/setup/initialize
echo ""
echo ""

# Check if watchers were created
echo "4. Checking Created Watchers..."
echo "-------------------------------"
curl -s http://localhost:8000/api/watchers/ | jq '.[] | {id, name, execution_mode, watch_interval, is_active}' 2>/dev/null || curl -s http://localhost:8000/api/watchers/
echo ""
echo ""

# Check recent change logs
echo "5. Checking Recent Change Logs..."
echo "--------------------------------"
curl -s "http://localhost:8000/api/change-logs?limit=5" | jq '.[] | {id, watcher_id, change_type, detected_at}' 2>/dev/null || curl -s "http://localhost:8000/api/change-logs?limit=5"
echo ""
echo ""

# Create test watchers for different content types and execution modes
echo "6. Creating Test Watchers..."
echo "----------------------------"

# Scheduled JSON Watcher
echo "Creating Scheduled JSON Watcher..."
curl -s -X POST http://localhost:8000/api/watchers/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Scheduled JSON API Watcher",
    "url": "http://localhost:8000/api/test/json",
    "method": "GET",
    "headers": {"User-Agent": "Vigilant/2.0"},
    "content_type": "json",
    "execution_mode": "scheduled",
    "watch_interval": 30,
    "is_active": true,
    "comparison_mode": "hash"
  }' | jq '.id, .name, .execution_mode' 2>/dev/null || echo "Scheduled JSON watcher created"

# Manual HTML Watcher
echo "Creating Manual HTML Watcher..."
curl -s -X POST http://localhost:8000/api/watchers/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manual HTML Page Watcher",
    "url": "http://localhost:8000/api/test/html",
    "method": "GET",
    "headers": {"User-Agent": "Vigilant/2.0"},
    "content_type": "html",
    "execution_mode": "manual",
    "is_active": true,
    "comparison_mode": "content_aware"
  }' | jq '.id, .name, .execution_mode' 2>/dev/null || echo "Manual HTML watcher created"

# Both Mode XML Watcher
echo "Creating Both Mode XML Watcher..."
curl -s -X POST http://localhost:8000/api/watchers/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Both Mode XML API Watcher",
    "url": "http://localhost:8000/api/test/xml",
    "method": "GET",
    "headers": {"User-Agent": "Vigilant/2.0"},
    "content_type": "xml",
    "execution_mode": "both",
    "watch_interval": 60,
    "is_active": true,
    "comparison_mode": "hash"
  }' | jq '.id, .name, .execution_mode' 2>/dev/null || echo "Both mode XML watcher created"

# Scheduled Text Watcher with Cookies
echo "Creating Scheduled Text Watcher with Cookies..."
curl -s -X POST http://localhost:8000/api/watchers/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Scheduled Text Watcher with Cookies",
    "url": "http://localhost:8000/api/test/text",
    "method": "GET",
    "headers": {"User-Agent": "Vigilant/2.0"},
    "content_type": "text",
    "execution_mode": "scheduled",
    "watch_interval": 45,
    "is_active": true,
    "save_cookies": true,
    "comparison_mode": "disabled"
  }' | jq '.id, .name, .execution_mode' 2>/dev/null || echo "Scheduled text watcher with cookies created"

# Manual POST Watcher
echo "Creating Manual POST Watcher..."
curl -s -X POST http://localhost:8000/api/watchers/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manual POST API Watcher",
    "url": "http://localhost:8000/api/test/ping",
    "method": "POST",
    "headers": {"Content-Type": "application/json", "User-Agent": "Vigilant/2.0"},
    "body": "{\"test\": \"data\", \"timestamp\": \"'$(date +%s)'\"}",
    "content_type": "json",
    "execution_mode": "manual",
    "is_active": true,
    "comparison_mode": "content_aware"
  }' | jq '.id, .name, .execution_mode' 2>/dev/null || echo "Manual POST watcher created"

# Scheduled Auto-Detect Watcher
echo "Creating Scheduled Auto-Detect Watcher..."
curl -s -X POST http://localhost:8000/api/watchers/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Scheduled Auto-Detect Watcher",
    "url": "http://localhost:8000/api/test/ping",
    "method": "GET",
    "headers": {"User-Agent": "Vigilant/2.0"},
    "content_type": "auto",
    "execution_mode": "scheduled",
    "watch_interval": 20,
    "is_active": true,
    "comparison_mode": "hash"
  }' | jq '.id, .name, .execution_mode' 2>/dev/null || echo "Scheduled auto-detect watcher created"

# Inactive Watcher
echo "Creating Inactive Watcher..."
curl -s -X POST http://localhost:8000/api/watchers/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Inactive Test Watcher",
    "url": "http://localhost:8000/api/test/ping",
    "method": "GET",
    "headers": {"User-Agent": "Vigilant/2.0"},
    "content_type": "auto",
    "execution_mode": "scheduled",
    "watch_interval": 30,
    "is_active": false,
    "comparison_mode": "hash"
  }' | jq '.id, .name, .is_active' 2>/dev/null || echo "Inactive watcher created"

echo ""
echo ""

# Check created watchers
echo "7. Checking Created Watchers..."
echo "-------------------------------"
curl -s http://localhost:8000/api/watchers/ | jq '.[] | {id, name, execution_mode, content_type, watch_interval, is_active}' 2>/dev/null || curl -s http://localhost:8000/api/watchers/
echo ""
echo ""

# Execute some manual watchers
echo "8. Executing Manual Watchers..."
echo "-------------------------------"
echo "Executing Manual HTML Watcher..."
curl -s -X POST http://localhost:8000/api/watchers/2/execute | jq '.message' 2>/dev/null || echo "Manual HTML watcher executed"

echo "Executing Manual POST Watcher..."
curl -s -X POST http://localhost:8000/api/watchers/5/execute | jq '.message' 2>/dev/null || echo "Manual POST watcher executed"

echo ""
echo ""

# Wait for scheduled watchers to execute
echo "9. Waiting for scheduled watchers to execute (35 seconds)..."
echo "----------------------------------------------------------"
sleep 35

# Check change logs
echo "10. Checking Change Logs..."
echo "---------------------------"
curl -s "http://localhost:8000/api/change-logs?limit=15" | jq '.[] | {id, watcher_id, change_type, new_size, detected_at}' 2>/dev/null || curl -s "http://localhost:8000/api/change-logs?limit=15"
echo ""
echo ""

# Check watcher statistics
echo "11. Checking Watcher Statistics..."
echo "---------------------------------"
curl -s "http://localhost:8000/api/watchers/statistics" | jq '.total_watchers, .active_watchers, .by_execution_mode' 2>/dev/null || curl -s "http://localhost:8000/api/watchers/statistics"
echo ""
echo ""

# Check change log statistics
echo "12. Checking Change Log Statistics..."
echo "------------------------------------"
curl -s "http://localhost:8000/api/change-logs/statistics" | jq '.total_changes, .new_changes, .modified_changes, .unchanged_changes' 2>/dev/null || curl -s "http://localhost:8000/api/change-logs/statistics"
echo ""
echo ""

echo "✅ Test completed!"
echo ""
echo "📋 What to expect:"
echo "• 7 different types of watchers created:"
echo "  - Scheduled JSON API watcher (30s interval)"
echo "  - Manual HTML page watcher"
echo "  - Both mode XML API watcher (60s interval)"
echo "  - Scheduled text watcher with cookies (45s interval)"
echo "  - Manual POST API watcher"
echo "  - Scheduled auto-detect watcher (20s interval)"
echo "  - Inactive test watcher"
echo "• Manual watchers executed immediately"
echo "• Scheduled watchers execute automatically"
echo "• Change logs show 'new', 'modified', and 'unchanged' entries"
echo "• Different content types and comparison modes tested"
echo "• Cookie functionality tested"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "👁️ Watchers: http://localhost:5173/watchers"
echo "📊 Change Logs: http://localhost:5173/change-logs"
