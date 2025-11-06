# Production Environment Setup

This document outlines the steps to set up the production environment for the ArtStop application, which consists of a backend API (Node.js/Express) and a frontend (React/Vite).

## Prerequisites

- Docker and Docker Compose installed on the production server
- Node.js 18+ installed (for local builds if needed)
- MongoDB database (cloud instance like MongoDB Atlas or self-hosted)
- Domain name and SSL certificate (optional but recommended)
- Git repository access

## Backend Setup

### 1. Environment Configuration

1. Copy the `.env.example` file to `.env` in the backend directory
2. Update the following environment variables:
   - `MONGODB_URI`: Your production MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT tokens
   - `PORT`: Production port (default 5000)
   - `NODE_ENV`: Set to 'production'
   - `CORS_ORIGIN`: Your frontend production URL

### 2. Docker Deployment

1. Ensure Docker is running on your server
2. Navigate to the backend directory
3. Build and run the application using Docker Compose:
   ```bash
   docker-compose up -d --build
   ```
4. Verify the container is running:
   ```bash
   docker ps
   ```

### 3. Database Setup

1. Ensure your MongoDB instance is accessible from the server
2. Run the seed script if needed (for initial data):
   ```bash
   docker exec -it backend_container_name node scripts/seed.js
   ```

## Frontend Setup

### 1. Environment Configuration

1. Copy the `.env.example` file to `.env` in the frontend directory
2. Update the following environment variables:
   - `VITE_API_BASE_URL`: Your backend production API URL

### 2. Build and Deploy

#### Option 1: Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure the build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

#### Option 2: Manual Build

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the application:
   ```bash
   npm run build
   ```
3. Serve the `dist` folder using a web server (nginx, Apache, etc.)

## CI/CD Setup

The project includes GitHub Actions workflows for automated deployment:

- `backend.yml`: Builds and pushes backend Docker image to registry
- `frontend.yml`: Deploys frontend to Vercel

Ensure the following secrets are set in your GitHub repository:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `VERCEL_TOKEN`
- `MONGODB_URI` (for backend)

## Monitoring and Maintenance

1. Set up log monitoring (e.g., using Docker logs or external services)
2. Configure backups for the database
3. Set up health checks for both backend and frontend
4. Monitor resource usage and scale as needed

## Security Considerations

1. Use HTTPS in production
2. Keep dependencies updated
3. Use strong passwords and secure secrets
4. Implement rate limiting and security headers
5. Regularly audit and update the codebase

## Troubleshooting

- Check Docker logs: `docker logs container_name`
- Verify environment variables are set correctly
- Ensure network connectivity between services
- Check firewall settings and port availability