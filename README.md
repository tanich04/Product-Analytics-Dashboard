# Interactive Product Analytics Dashboard
A full-stack dashboard that visualizes its own usage. Every user interaction (filter changes, chart clicks) is tracked and fed back into the visualization.

## Live Demo
- **Frontend**: [https://dashboard-frontend-ten-zeta.vercel.app](https://dashboard-frontend-ten-zeta.vercel.app)
- **Backend API**: [https://dashboard-backend-pj2u.onrender.com](https://dashboard-backend-pj2u.onrender.com)
- **Health Check**: [https://dashboard-backend-pj2u.onrender.com/health](https://dashboard-backend-pj2u.onrender.com/health)

## Testing: Register using your own account

## Features
- **JWT Authentication** - Secure register/login system
- **Interactive Filters** - Date range (with presets), age group, gender
- **Bar Chart** - Total clicks per feature (click bars to update line chart)
- **Line Chart** - Daily trends for selected feature
- **Self-Tracking** - Every interaction is tracked and fed back into analytics
- **Cookie Persistence** - Filters survive page refresh
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Recharts** - Charting library
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **React DatePicker** - Date range selection
- **js-cookie** - Cookie management
- **Vercel** - Hosting platform

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Sequelize ORM** - Database abstraction
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Render** - Hosting platform

### Data Flow
1. User interacts with dashboard (filters, chart clicks)
2. Frontend sends `POST /api/track` with feature name
3. Backend stores interaction in PostgreSQL
4. Charts fetch aggregated data via `GET /api/analytics`
5. Filters persist via cookies for page refresh

## Local Development

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/interactive-dashboard.git
   cd interactive-dashboard
   ```
2. **Backend Setup**
```bash
   cd backend
   npm install

# Create .env file
echo "PORT=5000
JWT_SECRET=your_super_secret_key_change_this
NODE_ENV=development
DB_NAME=vigility_db
DB_USER=postgres
DB_PASSWORD=abcd1234
DB_HOST=localhost
DB_PORT=5432" > .env

# Create database
createdb vigility_db

# Run seed script
npm run seed

# Start backend server
npm run dev
```

3. **Frontend Setup**:
```bash
cd ../frontend
npm install

# Create .env.development
echo "VITE_API_URL=http://localhost:5000/api" > .env.development

# Start frontend
npm run dev
```

#### Access Application:
Frontend: http://localhost:5173
Backend API: http://localhost:5000
Health check: http://localhost:5000/health

4. **Backend(.env)**:
```bash
PORT=5000
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
DB_NAME=vigility_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DATABASE_URL=postgresql://... (production only)
```
6. **Frontend(.env.production & .env.development)**:
```bash
# .env.development
VITE_API_URL=http://localhost:5000/api
# .env.production
VITE_API_URL=https://your-backend.onrender.com/api
```
7. **Database Seeding**:
Local Development
```bash
cd backend
npm run seed
```
Production (Render)
```bash
# Via Render Shell
npm run seed

# Or locally with production DB URL
export DATABASE_URL="postgresql://..."
node seed.js
```

## Scalability Essay: Handling 1 Million Write-Events Per Minute
If this dashboard needed to handle 1 million write-events per minute (~16,667 events/second), I would implement the following architectural changes:

1. Message Queue & Stream Processing
Replace direct database writes with a message queue system like Apache Kafka or Amazon Kinesis. Events would be published to Kafka topics, allowing multiple consumers to process data asynchronously without overwhelming the database.

2. Time-Series Database
Switch from PostgreSQL to a specialized time-series database like InfluxDB or TimescaleDB (PostgreSQL extension). These databases are optimized for high-velocity timestamped data with automatic downsampling and data retention policies.

3. Write-Behind Caching
Implement Redis as a write-behind cache. Events are first written to Redis (ultra-fast, in-memory), then batch-processed and persisted to the database periodically (e.g., every 5 seconds). This reduces database write load by ~99%.

4. Database Sharding
Partition data across multiple database instances by user_id hash or timestamp ranges. Each shard handles a subset of writes, enabling horizontal scaling. With 10 shards, each handles only 100,000 writes/minute.

5. Read/Write Separation
Implement CQRS (Command Query Responsibility Segregation) with separate databases for writes (event ingestion) and reads (analytics). The read database could use Elasticsearch for fast aggregations and full-text search on feature names.

6. Batch Aggregation
Pre-aggregate data at write time or via scheduled jobs. Instead of calculating "total clicks per feature" on every request, maintain pre-computed aggregates in Redis or a summary table, updated incrementally as new events arrive.

7. Auto-scaling Infrastructure
Deploy the backend on Kubernetes with Horizontal Pod Autoscaling based on CPU/memory or custom metrics (e.g., Kafka consumer lag). During peak loads, additional instances automatically spin up.

8. CDN for Static Assets
Move frontend static assets to a CDN (already using Vercel) to reduce load on the origin server and improve global response times.

9. Rate Limiting & Throttling
Implement API rate limiting per user/token to prevent abuse and ensure fair resource allocation across all users.

10. Monitoring & Alerting
Integrate Prometheus + Grafana for real-time monitoring of event throughput, database load, and consumer lag. Set up alerts to notify the team before thresholds are breached.

This architecture would handle 1M writes/minute by distributing load across multiple services, optimizing write patterns, and leveraging specialized databases designed for time-series data at scale.
