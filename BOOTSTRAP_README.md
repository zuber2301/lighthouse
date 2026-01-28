# Lighthouse Bootstrap Script

Complete one-command environment setup for the entire Lighthouse platform.

## 🚀 Quick Start

```bash
./bootstrap_lighthouse.sh
```

This single command will:
1. ✅ Check prerequisites (Docker, Docker Compose)
2. ✅ Build all Docker images
3. ✅ Start all containers (PostgreSQL, Redis, Backend, Frontend)
4. ✅ Run database migrations
5. ✅ Seed initial data (users, tenants, plans, etc.)
6. ✅ Display connection information

## 📋 Usage Options

### Standard Bootstrap (Default)
```bash
./bootstrap_lighthouse.sh
```
Full setup from scratch with migrations and seeding.

### Fresh Start (Clean Reset)
```bash
./bootstrap_lighthouse.sh --fresh
```
- Removes all Docker volumes
- Rebuilds images from scratch
- Runs migrations and seeding
- **Use when:** You need a completely clean environment

### Quick Start (Containers Only)
```bash
./bootstrap_lighthouse.sh --quick
```
- Just starts containers (assumes they're ready)
- Skips migrations and seeding
- **Use when:** Containers are already configured

### Seed Data Only
```bash
./bootstrap_lighthouse.sh --seed-only
```
- Runs seeding scripts on existing database
- Skips Docker setup and migrations
- **Use when:** You want to reload seed data without resetting

### Skip Seeding
```bash
./bootstrap_lighthouse.sh --no-seed
```
- Runs migrations but skips seed data
- **Use when:** You have existing data to preserve

### Show Logs
```bash
./bootstrap_lighthouse.sh --logs
```
- Displays container logs after startup
- Press Ctrl+C to exit
- **Use when:** You want to monitor startup in real-time

### Combine Options
```bash
# Fresh start with logs
./bootstrap_lighthouse.sh --fresh --logs

# Quick start, then seed
./bootstrap_lighthouse.sh --quick --seed-only
```

## 🌐 After Bootstrap

Once the script completes, you'll see:

```
╔════════════════════════════════════════════════════════════╗
║              LIGHTHOUSE ENVIRONMENT READY                   ║
╚════════════════════════════════════════════════════════════╝

🌐 Frontend:
   URL: http://localhost:5173

⚙️  Backend API:
   URL: http://localhost:18000
   Docs: http://localhost:18000/docs

🐘 PostgreSQL:
   Host: localhost
   Port: 5432
   User: lighthouse
   Password: lighthouse
   Database: lighthouse

🔴 Redis:
   Host: localhost
   Port: 6379
```

### Default Users & Tenants
After seeding, you'll have:
- **Platform Owner** user for admin access
- **ACME Corp** tenant with sample data
- **105+ test accounts** with various roles
- **Sample recognitions** and badges
- **Test personas** for demo workflows

## 🔍 Verify Installation

### Check Container Status
```bash
docker-compose ps
```

### View Backend Logs
```bash
docker-compose logs -f backend
```

### Test Backend API
```bash
curl http://localhost:18000/health
# or open http://localhost:18000/docs in browser
```

### Access Frontend
Open http://localhost:5173 in your browser

### Check Database Connection
```bash
docker-compose exec postgres psql -U lighthouse -d lighthouse -c "SELECT count(*) FROM users;"
```

## 🔧 Common Tasks

### Restart Services
```bash
docker-compose restart
```

### Stop All Services
```bash
docker-compose down
```

### Stop and Remove Volumes (Full Reset)
```bash
docker-compose down -v
./bootstrap_lighthouse.sh --fresh
```

### View Database Contents
```bash
docker-compose exec postgres psql -U lighthouse -d lighthouse
```

Inside psql:
```sql
\dt                           -- List all tables
SELECT * FROM tenants;        -- View tenants
SELECT * FROM users;          -- View users
SELECT COUNT(*) FROM users;   -- Count users
\q                            -- Exit
```

### Re-seed Data Without Full Reset
```bash
./bootstrap_lighthouse.sh --seed-only
```

### Run Specific Migrations Only
```bash
docker-compose exec backend python run_migrations.py upgrade
```

### Create New Migration
```bash
cd backend
alembic revision --autogenerate -m "description of changes"
```

## 📊 What Gets Created

### Database Objects
- ✅ All tables (users, tenants, recognitions, etc.)
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ Alembic migration tracking

### Default Data
- ✅ Subscription plans (Basic, Starter, Professional, Enterprise)
- ✅ Global rewards and badges
- ✅ Platform settings
- ✅ Sample tenant (ACME Corp)
- ✅ Platform owner user
- ✅ 105 test user accounts
- ✅ Sample recognitions

### Services
- ✅ PostgreSQL database (port 5432)
- ✅ Redis cache (port 6379)
- ✅ Backend API (port 18000)
- ✅ Frontend dev server (port 5173)

## 🚨 Troubleshooting

### "Docker is not installed"
Install Docker: https://docs.docker.com/install

### "Cannot connect to localhost:18000"
```bash
# Check if backend is running
docker-compose ps

# View backend logs
docker-compose logs backend

# Wait a few more seconds and try again
sleep 10 && curl http://localhost:18000/health
```

### "Database connection refused"
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### "Port already in use"
If ports are already in use, docker-compose will use the next available port. Check the actual running port:
```bash
docker-compose ps
```

### "Migrations fail"
```bash
# Check migration status
docker-compose exec backend python run_migrations.py current

# Downgrade last migration
docker-compose exec backend python run_migrations.py downgrade -1

# Re-run migrations
./bootstrap_lighthouse.sh --no-seed
```

### "Seed data fails"
```bash
# Try running seed again
./bootstrap_lighthouse.sh --seed-only

# Or with verbose output
docker-compose exec backend python seed_data.py
```

## 📝 Script Features

- **Color-coded output**: Easy to follow progress
- **Error handling**: Stops on first failure with clear messages
- **Health checks**: Verifies services are ready
- **Flexible options**: Run full setup or just specific steps
- **Container logs**: Integrated logging display
- **Status display**: Shows running containers and connection info

## 🔐 Security Notes

**Development Only**: Default credentials are for local development:
- PostgreSQL user: `lighthouse` / password: `lighthouse`
- JWT secret: `changeme` (should be changed in production)
- No SSL/TLS in development setup

For production:
1. Use environment variables for sensitive values
2. Change JWT_SECRET to secure random value
3. Use strong database passwords
4. Enable SSL/TLS connections
5. Run migrations in restricted environments only

## 📚 Additional Resources

- [Development Guide](README.md)
- [API Documentation](http://localhost:18000/docs)
- [Docker Compose Reference](docker-compose.yml)
- [Database Migrations](backend/migrations/)

## ✅ Checklist After Bootstrap

- [ ] Frontend loads at http://localhost:5173
- [ ] Backend API responds at http://localhost:18000
- [ ] Can access API docs at http://localhost:18000/docs
- [ ] Database contains tables and seed data
- [ ] Can log in with test credentials
- [ ] Tenants and users visible in admin panel
- [ ] Sample recognitions appear in system

---

**Ready to go!** 🚀

For issues, check the logs with:
```bash
docker-compose logs -f
```
