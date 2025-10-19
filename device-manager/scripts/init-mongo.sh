#!/usr/bin/env bash
set -euo pipefail
echo "Waiting for Mongo to be healthy..."
for i in {1..30}; do
  if docker exec ccw_mongo mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    echo "Mongo healthy"
    break
  fi
  sleep 2
done