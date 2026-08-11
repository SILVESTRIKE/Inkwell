#!/usr/bin/env bash
set -e

echo "=== Running Backend Tests ==="
npm --prefix backend test

echo "=== Running Frontend Tests ==="
npm --prefix frontend test

echo "=== All Tests Completed Successfully ==="
