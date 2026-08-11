#!/usr/bin/env bash
set -e

echo "Starting Docker containers (MongoDB & Redis)..."
docker-compose up -d

echo "Starting Backend and Frontend..."
npm --prefix backend run dev &
npm --prefix frontend run dev &

wait
