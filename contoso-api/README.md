# Contoso University API

Node.js backend for Contoso University - Migrated from ASP.NET Core.

## Prerequisites

- Node.js 18+
- SQL Server (using existing ContosoUniversity database)
- npm

## Setup

1. Install dependencies:

   ```sh
   npm.cmd install
   ```

2. Copy `.env.example` to `.env` and configure your database connection:

   ```sh
   copy .env.example .env
   ```

3. Update `.env` with your SQL Server credentials

## Running the Application

### Development Mode

```sh
npm.cmd run dev
```

### Production Build

```sh
npm.cmd run build
npm.cmd start
```

## API Endpoints

- `GET /` - API information
- `GET /api/health` - Health check endpoint

## Project Structure

```
contoso-api/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── .env                 # Environment variables (not in git)
├── .env.example         # Example environment variables
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## Testing

Visit `http://localhost:5000/api/health` to verify the server and database connection.
