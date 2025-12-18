# Xandeum pNode Explorer Frontend

Production-ready analytics dashboard frontend for Xandeum pNode network. Features real-time monitoring, interactive maps, detailed node analytics, and comprehensive filtering.

## Tech Stack

- **Vite** - Fast build tool
- **TypeScript** - Type safety
- **React** 18+ - UI framework
- **React Router** - Client-side routing
- **shadcn-ui** - Component library
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Leaflet** - Interactive maps
- **TanStack Query** - Data fetching and caching

## Quick Start

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Configuration

The frontend automatically uses the production backend URL (`https://xandeum-pnode-backend-production.up.railway.app`) in production builds.

For local development, create `.env.local`:
```env
VITE_API_URL=http://localhost:3000
```

## Key Features

### Dashboard
- Real-time metric cards (Total pNodes, Online %, Health Score, Storage)
- Interactive charts (Uptime history, Storage distribution)
- Global map with geographic clustering and health-based visualization
- Comprehensive node directory table with sorting, filtering, and pagination

### Node Directory
- Sortable, filterable table with all node metrics
- Column visibility controls
- Health scores and tier classification
- Storage and RAM utilization with progress bars
- Click-to-view detailed node information

### Node Details
- Sidebar panel with comprehensive node information
- Storage and RAM details
- Network information and uptime metrics

## Deployment

### Vercel (Recommended)

1. Import Git repository
2. Set root directory to `/Xandeum-pnode-frontend`
3. Framework: Vite (auto-detected)
4. Deploy

**Optional:** Set `VITE_API_URL` environment variable (already configured by default).

## Backend Integration

The frontend consumes the following API endpoints:

- `GET /pnodes` - All pNodes with RAM data
- `GET /analytics/summary` - Network statistics
- `GET /analytics/extended-summary` - Advanced metrics
- `GET /analytics/node-metrics` - Per-node metrics
- `GET /analytics/top-nodes` - Top 10 nodes
- `GET /analytics/storage-pressure` - Storage pressure
- `GET /analytics/storage` - Storage utilization
- `GET /analytics/versions` - Version distribution
- `GET /analytics/geo-summary` - Geographic distribution
- `GET /pnodes/map` - Map data with coordinates

## Features

- Auto-refresh every 30 seconds
- Real-time updates
- Responsive design
- Dark theme
- Error handling with retry options
- Loading states and skeleton loaders

## License

MIT
