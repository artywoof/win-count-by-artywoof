# Win Count License API

License management system for Win Count by ArtYWoof desktop application.

## API Endpoints

### 🔍 License Validation
- **POST** `/api/validate-license`
- **Purpose**: Validate license key with machine ID
- **Body**: `{ license_key, machine_id }`
- **Response**: `{ success, valid, license_info }`

### 💓 Real-time Heartbeat
- **POST** `/api/heartbeat`
- **Purpose**: Real-time license validation with signature verification
- **Body**: `{ license_key, machine_id, timestamp, signature, app_version }`
- **Response**: `{ success, valid, heartbeat_info }`

### 🔑 Generate License (Admin)
- **POST** `/api/generate-license`
- **Purpose**: Generate new license for customer
- **Body**: `{ machine_id, email, duration_months, admin_key }`
- **Response**: `{ success, license_info }`

### 🚫 Revoke License (Admin)
- **POST** `/api/revoke-license`
- **Purpose**: Revoke existing license
- **Body**: `{ license_key, admin_key, reason }`
- **Response**: `{ success, license_info }`

### 📋 List Licenses (Admin)
- **GET** `/api/list-licenses`
- **Purpose**: List all licenses with pagination
- **Query**: `?admin_key=xxx&status=active&limit=100&offset=0`
- **Response**: `{ success, licenses, pagination }`

## Database Schema

```sql
CREATE TABLE licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_id TEXT NOT NULL,
    license_key TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);
```

## Security Features

- **Signature Verification**: Heartbeat uses SHA-256 signature
- **Timestamp Validation**: Prevents replay attacks
- **Admin Authentication**: Simple key-based admin access
- **Machine Binding**: Licenses tied to specific machine IDs
- **Status Management**: Active, expired, revoked states

## Environment Variables

- `ADMIN_KEY`: Admin authentication key (default: 'artywoof_admin_2024')

## Usage Examples

### Generate License
```bash
curl -X POST https://your-api.vercel.app/api/generate-license \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": "abc123",
    "email": "customer@example.com",
    "duration_months": 1,
    "admin_key": "artywoof_admin_2024"
  }'
```

### Validate License
```bash
curl -X POST https://your-api.vercel.app/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "ABC123DEF456",
    "machine_id": "abc123"
  }'
```

### List Licenses
```bash
curl "https://your-api.vercel.app/api/list-licenses?admin_key=artywoof_admin_2024&status=active&limit=10"
```

## Deployment

Deploy to Vercel with SQLite database support.
