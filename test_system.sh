#!/bin/bash

# Test script for Vigilant monitoring system
# This script tests the ping and cookie endpoints

echo "🧪 Testing Vigilant Monitoring System"
echo "=================================="
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

# Check if requests were created
echo "4. Checking Created Requests..."
echo "------------------------------"
curl -s http://localhost:8000/api/requests/ | jq '.data[] | {id, name, watch_interval, is_active}' 2>/dev/null || curl -s http://localhost:8000/api/requests/
echo ""
echo ""

# Check recent logs
echo "5. Checking Recent Logs..."
echo "------------------------"
curl -s "http://localhost:8000/api/logs?limit=5" | jq '.data[] | {id, url, status_code, created_at}' 2>/dev/null || curl -s "http://localhost:8000/api/logs?limit=5"
echo ""
echo ""

echo "✅ Test completed!"
echo ""
echo "📋 What to expect:"
echo "• Ping endpoint should return random data"
echo "• Cookie endpoint should set a test_cookie"
echo "• Setup should create 2 default requests"
echo "• Requests should execute automatically based on their intervals"
echo "• Toast notifications should appear in the frontend"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
