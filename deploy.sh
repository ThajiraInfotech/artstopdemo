#!/bin/bash

set -e

echo "Starting full deployment..."

echo "Deploying backend..."
cd backend && npm run deploy

echo "Deploying frontend..."
cd ../frontend && npm run deploy

echo "Full deployment completed successfully."