# Spring Boot e-commerce backend

Spring Boot 3.4 + Spring Data MongoDB replacement for the Express backend.

## Run

Requires Java 17+ and MongoDB.

```powershell
cd backend
mvn spring-boot:run
```

The API listens on `http://localhost:5000/api`.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Backend HTTP port |
| `MONGO_URI` | `mongodb://localhost:27017/ecommerce` | MongoDB connection URI |
| `JWT_SECRET` | Development fallback | JWT signing secret; set a strong value in production |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed Vite CORS origin |
| `SUPER_ADMIN_NAME` | empty | Creates a bootstrap admin when all three admin variables are set |
| `SUPER_ADMIN_EMAIL` | empty | Bootstrap admin email |
| `SUPER_ADMIN_PASSWORD` | empty | Bootstrap admin password |
| `SEED_ON_STARTUP` | `false` | Seed sample products and coupons only when collections are empty |

PowerShell example:

```powershell
$env:MONGO_URI="mongodb://localhost:27017/ecommerce"
$env:JWT_SECRET="use-a-long-random-production-secret"
$env:FRONTEND_URL="http://localhost:5174"
$env:SUPER_ADMIN_NAME="Super Admin"
$env:SUPER_ADMIN_EMAIL="admin@example.com"
$env:SUPER_ADMIN_PASSWORD="ChangeMe123!"
$env:SEED_ON_STARTUP="true"
mvn spring-boot:run
```

The existing frontend keeps port `5173` and defaults to `http://localhost:5000/api`. Set `VITE_API_URL` if either host or port changes.
