
***

### 5) `.claude/commands/deploy.md`

```markdown
# Full Deploy Checklist (Docker → AWS)

## Pre-Deploy Checks

- [ ] All env vars set in `.env.production` (never committed).
- [ ] `prisma migrate deploy` run against production DB.
- [ ] All Docker images build successfully locally.
- [ ] No `console.log` in production code.
- [ ] No hardcoded secrets anywhere (`git grep -r "sk-" .`).
- [ ] GitHub Actions CI passes (lint + tests).

## Local Docker Build Test

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose ps
AWS Deploy Steps
bash
# 1. SSH into EC2
ssh -i ~/.ssh/flowforge.pem ec2-user@<EC2_IP>

# 2. Pull latest
cd /app/FlowForge
git pull origin main

# 3. Run DB migrations
docker compose exec api npx prisma migrate deploy

# 4. Rebuild and restart services
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --force-recreate

# 5. Verify health
docker compose ps
docker compose logs -f api
Rollback
bash
git revert HEAD
docker compose -f docker-compose.prod.yml up -d --force-recreate
Post-Deploy Verification
 API health check: curl https://api.flowforge.app/health.

 GraphQL playground accessible.

 Firebase Auth login works.

 At least one workflow run completes successfully.

 Prometheus metrics visible in Grafana.