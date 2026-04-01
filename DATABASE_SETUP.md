# Database Setup Guide

This guide will help you set up the PostgreSQL database for SkillSpark.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (local or cloud)
- npm or yarn package manager

## Database Configuration

### Option 1: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database named `skillspark`
3. Set your environment variables:

```bash
# Create .env file in the project root
DATABASE_URL=postgresql://username:password@localhost:5432/skillspark
PORT=5555
NODE_ENV=development
```

### Option 2: Neon Database (Recommended)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Set your environment variables:

```bash
# Create .env file in the project root
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/skillspark?sslmode=require
PORT=5555
NODE_ENV=development
```

### Option 3: Other Cloud Providers

You can use any PostgreSQL-compatible database:
- Supabase
- Railway
- PlanetScale
- AWS RDS
- Google Cloud SQL

## Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example and fill in your database URL
   cp .env.example .env
   # Edit .env with your database connection string
   ```

3. **Generate database migrations:**
   ```bash
   npm run db:generate
   ```

4. **Push schema to database:**
   ```bash
   npm run db:push
   ```

5. **Seed the database with sample data:**
   ```bash
   npm run db:seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

## Available Database Commands

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:push` - Push schema changes directly to database (development)
- `npm run db:migrate` - Run pending migrations (production)
- `npm run db:seed` - Populate database with sample data
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Database Schema

The database includes the following tables:

- **users** - User accounts (students and instructors)
- **categories** - Course categories
- **instructors** - Instructor profiles and details
- **courses** - Course information and metadata
- **enrollments** - Student course enrollments
- **bookings** - Session bookings between students and instructors
- **reviews** - Course and instructor reviews
- **messages** - User messaging system

## Troubleshooting

### Connection Issues

1. Verify your `DATABASE_URL` is correct
2. Check if your database server is running
3. Ensure your IP is whitelisted (for cloud databases)
4. Verify SSL settings if using cloud databases

### Migration Issues

1. Make sure your database is empty or use `db:push` for development
2. Check that all required environment variables are set
3. Verify your database user has proper permissions

### Seeding Issues

1. Ensure the database schema is created first
2. Check that all foreign key relationships are correct
3. Verify that sample data doesn't conflict with existing data

## Production Deployment

For production deployment:

1. Use `npm run db:generate` to create migration files
2. Use `npm run db:migrate` to apply migrations
3. Set `NODE_ENV=production`
4. Use a managed database service
5. Set up proper backup and monitoring

## Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify your database connection
3. Ensure all environment variables are set correctly
4. Check the Drizzle documentation for advanced configuration

