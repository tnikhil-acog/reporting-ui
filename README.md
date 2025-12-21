# Reporting Framework Web UI

A production-ready Next.js web application for generating LLM-powered reports with job queue management.

## Features

- 🌐 **Modern Web Interface** - Next.js 16 with React 19 and App Router
- 📊 **Multiple Pipelines** - Support for PubMed, Patents, Staffing, and custom plugins
- 🔄 **Background Processing** - BullMQ job queue with Redis for async report generation
- 📈 **Real-time Progress** - Live job status updates and progress tracking
- 🐳 **Docker Ready** - Complete containerization with docker-compose
- 🔌 **Plugin System** - Extensible architecture for custom data sources
- 📁 **Multiple Formats** - Generates HTML, Markdown, and PDF reports
- 🔁 **Retry Logic** - Automatic retry with exponential backoff for API failures
- 🔐 **Profile Support** - API key management via config files

## Architecture

```
┌─────────────────┐
│   Next.js UI    │ ← User Interface (Port 3000)
│  (reporting-ui) │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Redis  │ ← Job Queue (BullMQ)
    └────┬────┘
         │
┌────────▼────────┐
│  Worker Process │ ← Background Job Processing
│   (BullMQ)      │
└─────────────────┘
         │
    ┌────▼────────────────┐
    │ Plugin System       │ ← PubMed, Patent, Staffing
    │ - fetchFromAPI()    │
    │ - processAPIData()  │
    │ - generate()        │
    └─────────────────────┘
         │
    ┌────▼────────────────┐
    │ LLM Providers       │ ← Gemini, OpenAI, DeepSeek
    └─────────────────────┘
         │
    ┌────▼────────────────┐
    │ Report Files        │ ← /shared/reporting-framework/reports/
    │ - HTML, MD, PDF     │
    └─────────────────────┘
```

## Prerequisites

- **Node.js**: 20 or higher
- **pnpm**: 8 or higher (or npm/yarn)
- **Redis**: 7 or higher (running locally or via Docker)
- **Plugins**: Installed in `/shared/reporting-framework/plugins/`
- **API Keys**: Configured in `~/.framework-cli/config.json`

## Installation

### Local Development

```bash
# Install dependencies
pnpm install

# Start Redis (if not already running)
docker run -d -p 6379:6379 redis:7-alpine

# Run in development mode
pnpm dev          # Next.js dev server (port 3000)
pnpm worker:dev   # Worker process (separate terminal)
```

### Docker Compose (Recommended for Production)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Configuration

### Environment Variables

Create `.env.local` for development or set in docker-compose:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Worker Configuration
WORKER_CONCURRENCY=2

# Shared Directories
PLUGINS_DIR=/shared/reporting-framework/plugins
REPORTS_DIR=/shared/reporting-framework/reports
BUNDLES_DIR=/shared/reporting-framework/bundles
PIPELINES_REGISTRY=/shared/reporting-framework/plugins.json

# LLM API Keys (optional - fallback if config.json not available)
GOOGLE_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key

# LLM Defaults
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash-lite
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=4000
```

### API Keys Configuration

The worker reads API keys from `~/.framework-cli/config.json`:

```json
{
  "defaultProfile": "default",
  "profiles": {
    "default": {
      "provider": "gemini",
      "model": "gemini-2.5-flash-lite",
      "apiKey": "your-api-key-here"
    }
  }
}
```

**For Docker**: Mount the config file as a volume:

```yaml
volumes:
  - ~/.framework-cli/config.json:/root/.framework-cli/config.json:ro
```

### Plugin Registry

Plugins are discovered via `/shared/reporting-framework/plugins.json`:

```json
{
  "pubmed": {
    "id": "pubmed",
    "name": "Pubmed Literature",
    "packageName": "@aganitha/plugin-pubmed",
    "className": "PubMedPlugin",
    "version": "1.0.0"
  },
  "patent": {
    "id": "patent",
    "name": "Patent Analysis",
    "packageName": "@aganitha/plugin-patent",
    "className": "PatentPlugin",
    "version": "1.0.0"
  }
}
```

## Usage

### 1. Access the Web UI

Navigate to `http://localhost:3000`

### 2. Generate a Report

1. Select a pipeline (e.g., "PubMed Literature")
2. Enter report details:
   - Report name
   - Search keywords
   - Number of articles
3. Click "Generate Report"
4. Monitor progress in real-time
5. Download report when complete

### 3. View Reports

- All generated reports are saved to `/shared/reporting-framework/reports/{plugin-id}/`
- Three formats: `.html`, `.md`, `.pdf`
- Reports list page shows all completed reports

## Docker Deployment

### Production Setup

The `docker-compose.yml` includes:

- **Redis**: Persistent job queue storage
- **Next.js App**: Web UI and API
- **Shared Volumes**: Reports and plugins

### Important Volume Mounts

```yaml
services:
  reporting-ui:
    volumes:
      # Shared framework directory (read-only)
      - /shared/reporting-framework:/shared/reporting-framework:ro

      # Reports directory (read-write)
      - /shared/reporting-framework/reports:/shared/reporting-framework/reports:rw

      # API keys configuration (read-only)
      - ~/.framework-cli/config.json:/root/.framework-cli/config.json:ro
```

### Dockerfile Features

- **Multi-stage build**: Optimized image size
- **Production dependencies**: Only production packages included
- **Next.js optimization**: Pre-built and optimized
- **Health checks**: Container health monitoring

## Worker Process

The worker is a separate process that handles background job processing.

### Running the Worker

**Development:**

```bash
pnpm worker:dev
```

**Production (standalone):**

```bash
pnpm worker:build
node dist/worker/index.js
```

**Production (Docker):**

```bash
# Run as separate service in docker-compose
docker-compose run -d reporting-ui pnpm worker
```

### Worker Features

- ✅ **Job Queue**: BullMQ with Redis
- ✅ **Concurrency**: Process multiple reports in parallel (configurable)
- ✅ **Retry Logic**: Exponential backoff for network errors (3 retries)
- ✅ **Progress Tracking**: 10-step progress reporting
- ✅ **Plugin Loading**: Dynamic plugin loading from filesystem
- ✅ **API Integration**: Direct API calls to data sources (PubMed, etc.)
- ✅ **LLM Processing**: Multi-provider support (Gemini, OpenAI, DeepSeek)
- ✅ **Multi-format Output**: Generates HTML, MD, and PDF simultaneously

## API Endpoints

### POST `/api/reports/generate`

Create a new report generation job.

**Request:**

```json
{
  "pipelineId": "pubmed",
  "reportName": "Covid-19 Research",
  "query": {
    "keywords": "covid-19",
    "numberOfArticles": 20
  }
}
```

**Response:**

```json
{
  "jobId": "job_1234567890_abc123",
  "status": "pending",
  "message": "Report job created successfully"
}
```

### GET `/api/reports/status/:jobId`

Get job status and progress.

**Response:**

```json
{
  "job": {
    "id": "job_1234567890_abc123",
    "status": "active",
    "progress": 60,
    "currentStep": "Generating report",
    "data": {
      /* job data */
    }
  }
}
```

### GET `/api/pipelines`

List available pipelines (plugins).

**Response:**

```json
{
  "pipelines": [
    {
      "id": "pubmed",
      "name": "Pubmed Literature",
      "description": "Search and analyze PubMed literature"
    }
  ]
}
```

## Troubleshooting

### Worker Not Processing Jobs

**Check Redis connection:**

```bash
redis-cli ping  # Should return "PONG"
```

**Check worker logs:**

```bash
pnpm worker:dev  # Should show "Worker ready"
```

### API Timeout Errors

The worker includes retry logic with exponential backoff:

- Initial delay: 2 seconds
- Max retries: 3
- Max delay: 15 seconds

Network errors are automatically retried.

### Plugin Not Found

**Verify plugin registry:**

```bash
cat /shared/reporting-framework/plugins.json
```

**Check plugin installation:**

```bash
ls -la /shared/reporting-framework/plugins/
```

### Missing API Keys

**Check config file:**

```bash
cat ~/.framework-cli/config.json
```

**Or set environment variables:**

```bash
export GOOGLE_API_KEY=your-key-here
```

## Development

### Project Structure

```
reporting-ui/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── config/       # LLM config endpoint
│   │   ├── pipelines/    # Pipeline listing
│   │   └── reports/      # Report generation & status
│   ├── reports/          # Reports UI pages
│   └── layout.tsx        # Root layout
├── components/            # React components
├── lib/                  # Core libraries
│   ├── job-queue.ts     # BullMQ job creation
│   ├── redis.ts         # Redis client
│   ├── pipeline-loader.ts
│   └── report-queue.ts  # Job queue types
├── worker/               # Background worker
│   ├── index.ts         # Worker entry point
│   ├── plugin-loader.ts # Dynamic plugin loading
│   └── report-generator.ts  # Report generation logic
├── docker-compose.yml    # Docker orchestration
├── Dockerfile           # Container build
└── package.json         # Dependencies & scripts
```

### Adding a New Pipeline

1. **Create plugin** following `@aganitha/framework` plugin interface
2. **Install plugin** in `/shared/reporting-framework/plugins/`
3. **Register plugin** in `plugins.json`
4. **Restart worker** to load new plugin

### Testing

```bash
# Test Phase 1: Pipeline listing
node test-phase1.mjs

# Test Phase 2: Report generation
node test-phase2.mjs
```

## Production Checklist

- [ ] Redis is running and accessible
- [ ] All plugins are installed in `/shared/reporting-framework/plugins/`
- [ ] `plugins.json` registry is up to date
- [ ] API keys are configured in `~/.framework-cli/config.json`
- [ ] Shared volumes have correct permissions
- [ ] Worker process is running
- [ ] Health checks are passing
- [ ] Environment variables are set
- [ ] Docker volumes are mounted correctly

## Scripts

```bash
# Development
pnpm dev          # Start Next.js dev server
pnpm worker:dev   # Start worker in watch mode

# Production
pnpm build        # Build Next.js app
pnpm start        # Start production server
pnpm worker       # Start worker process

# Worker build
pnpm worker:build # Compile worker TypeScript

# Testing
pnpm test:phase2  # Test report generation
```

## Performance

- **Concurrent Jobs**: 2 (configurable via `WORKER_CONCURRENCY`)
- **Report Generation**: 30-60 seconds per report (depends on LLM)
- **Redis Memory**: ~100MB per 1000 jobs
- **Output Size**: 500KB-2MB per report (all formats)

## License

MIT

## Author

Nikhil Tiwari

## Support

For issues or questions, refer to the main project documentation or open an issue.
