# Quick Start Guide

## 🚀 Database Integration Setup

The database integration is now complete! Here's how to get started:

### 1. Set up your database

**Option A: Use Neon Database (Recommended)**
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string

**Option B: Use Local PostgreSQL**
1. Install PostgreSQL locally
2. Create a database named `skillspark`

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/skillspark

# Server Configuration
PORT=5555
NODE_ENV=development
```

### 3. Run the setup

```bash
# Install dependencies
npm install

# Set up database (creates tables and seeds data)
npm run setup-db

# Test the integration
npm run test-db

# Start development server
npm run dev
```

### 4. Manual setup (if needed)

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed

# Start development server
npm run dev
```

## 🎯 What's Working

✅ **Database Connection**: PostgreSQL with Drizzle ORM
✅ **All CRUD Operations**: Users, courses, instructors, bookings, etc.
✅ **Complex Relationships**: Courses with instructors, bookings with details
✅ **Type Safety**: Full TypeScript support
✅ **Sample Data**: Pre-populated with test data
✅ **API Endpoints**: All existing endpoints work with real data

## 🔧 Available Commands

- `npm run dev` - Start development server
- `npm run setup-db` - Complete database setup
- `npm run test-db` - Test database connectivity
- `npm run db:studio` - Open database GUI
- `npm run db:seed` - Populate with sample data

## 🌐 Access Your App

Once running, visit: http://localhost:5555

The application now has persistent data storage and all features are working with the real database!

## 🐛 Troubleshooting

If you encounter issues:

1. **Check your DATABASE_URL** - Make sure it's correct
2. **Verify database is running** - Ensure your database server is accessible
3. **Check environment variables** - Make sure .env file is properly configured
4. **Run the test** - Use `npm run test-db` to verify everything works

The database integration is complete and ready for development! 🎉

