#!/bin/bash

# Kill any existing node processes
pkill -f "node"

# Start the server in test mode
NODE_ENV=test PORT=3000 npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Run the tests
NODE_ENV=test npm test tests/user-creation.test.ts

# Kill the server
kill $SERVER_PID 