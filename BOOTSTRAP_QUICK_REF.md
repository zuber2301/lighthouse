# Bootstrap Quick Reference

## One Command Setup
```bash
./bootstrap_lighthouse.sh
```

## Common Scenarios

| Scenario | Command | When to Use |
|----------|---------|------------|
| **First Time Setup** | `./bootstrap_lighthouse.sh` | Brand new environment |
| **Clean Slate** | `./bootstrap_lighthouse.sh --fresh` | Complete reset, remove old data |
| **Just Start** | `./bootstrap_lighthouse.sh --quick` | Containers already built |
| **Reload Data** | `./bootstrap_lighthouse.sh --seed-only` | Keep DB schema, refresh data |
| **Watch Startup** | `./bootstrap_lighthouse.sh --logs` | Debug startup issues |
| **No Initial Data** | `./bootstrap_lighthouse.sh --no-seed` | Run migrations only |

## After Bootstrap

```
Frontend:     http://localhost:5173
Backend API:  http://localhost:18000
API Docs:     http://localhost:18000/docs
Database:     localhost:5432
Redis:        localhost:6379
```

## Default Credentials
```
Database User:  lighthouse
Database Pass:  lighthouse
Database Name:  lighthouse
```

## Useful Docker Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Full reset
docker-compose down -v
./bootstrap_lighthouse.sh --fresh

# Database shell
docker-compose exec postgres psql -U lighthouse -d lighthouse

# Backend shell
docker-compose exec backend bash
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Ports auto-increment, check `docker-compose ps` |
| Backend not ready | Wait 10-15 seconds, check logs with `docker-compose logs backend` |
| Database error | `docker-compose down -v && ./bootstrap_lighthouse.sh --fresh` |
| Seed fails | `./bootstrap_lighthouse.sh --seed-only` to retry |

## What Gets Set Up

✅ PostgreSQL database with all tables
✅ Redis cache server  
✅ Backend API (FastAPI)
✅ Frontend dev server (Vite)
✅ Database migrations applied
✅ Initial seed data loaded
✅ Test users and tenants created
✅ Sample recognitions added

## Next Steps

1. Open http://localhost:5173 in browser
2. Log in with test credentials
3. Explore admin panel
4. Check API docs at http://localhost:18000/docs
5. View database tables with: `docker-compose exec postgres psql -U lighthouse -d lighthouse`

---

**Full documentation:** [BOOTSTRAP_README.md](BOOTSTRAP_README.md)
