# Deployment Guide

## Backend (Render)

1. Create a Render account at https://render.com
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `vigility-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (generate a secure random string)
6. Click "Create Web Service"
7. Once deployed, copy the URL (e.g., https://vigility-backend.onrender.com)

## Database (Render PostgreSQL)

1. In Render dashboard, click "New +" and select "PostgreSQL"
2. Configure:
   - Name: `vigility-db`
   - Database: `vigility_db`
   - User: `vigility_user`
3. Click "Create Database"
4. Copy the "Internal Database URL" and add it to your backend service as `DATABASE_URL`
5. Run seed on production:
   ```bash
   # SSH into Render shell or run locally with production URL
   npm run seed:prod