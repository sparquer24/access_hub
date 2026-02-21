
# Backend Schema and API Documentation

## Database Schema (Tables in `public` schema)

### Table: users
- id (PK, UUID)
- email (unique, required)
- username (unique, required)
- password_hash (required)
- role_id (FK to roles.id)
- organization_id (FK to organizations.id, nullable)
- is_active (bool)
- last_login (datetime)
- created_at, updated_at, deleted_at (audit)

### Table: employees
- id (PK, UUID)
- user_id (FK to users.id, unique, required)
- organization_id (FK to organizations.id, required)
- department_id (FK to departments.id, required)
- employee_code (required)
- full_name (required)
- gender, date_of_birth, phone_number, emergency_contact (JSON), address
- joining_date, designation, employment_type
- shift_id (FK to shifts.id)
- is_active (bool)
- created_at, updated_at, deleted_at (audit)

### Table: organizations
- id (PK, UUID)
- name (unique, required)
- code (unique, required)
- address, contact_email, contact_phone
- subscription_tier, organization_type, timezone
- working_hours (JSON), settings (JSON)
- is_active (bool)
- created_at, updated_at, deleted_at (audit)

### Table: departments
- id (PK, UUID)
- organization_id (FK to organizations.id)
- name, code, description
- manager_id (FK to employees.id)
- is_active (bool)
- created_at, updated_at, deleted_at (audit)

### Table: face_embeddings
- id (PK, UUID)
- employee_id (FK to employees.id)
- organization_id (FK to organizations.id)
- embedding_vector (JSON)
- model_version, quality_score, image_url, is_primary
- created_at, updated_at, deleted_at (audit)

### Table: presence_events
- id (PK, UUID)
- organization_id (FK to organizations.id)
- employee_id (FK to employees.id, nullable)
- camera_id (FK to cameras.id)
- location_id (FK to locations.id)
- event_type, timestamp
- confidence_score, liveness_verified, liveness_score
- face_bbox (JSON), face_quality_score, image_url
- review_status, reviewed_by (FK to users.id), reviewed_at, review_notes
- attendance_record_id (FK to attendance_records.id)
- device_info (JSON), processing_time_ms
- is_unknown_face, is_anomaly, anomaly_reason
- created_at (audit)

### Table: cameras
- id (PK, UUID)
- organization_id (FK to organizations.id)
- location_id (FK to locations.id)
- name, camera_type, source_type, source_url, source_config (JSON)
- fps, resolution, confidence_threshold, liveness_check_enabled
- is_active (bool), last_heartbeat, status, error_message
- created_at, updated_at, deleted_at (audit)

### Table: attendance_records
- id (PK, UUID)
- employee_id (FK to employees.id)
- organization_id (FK to organizations.id)
- camera_id (FK to cameras.id)
- date, check_in_time, check_out_time
- status, work_hours
- location_check_in (JSON), location_check_out (JSON)
- device_info (JSON), face_match_confidence, liveness_verified
- review_status, notes
- approved_by (FK to users.id)
- created_at, updated_at (audit)

### Table: leave_requests
- id (PK, UUID)
- employee_id (FK to employees.id)
- organization_id (FK to organizations.id)
- leave_type, start_date, end_date, total_days
- reason, status, approved_by (FK to users.id), approval_notes
- created_at, updated_at (audit)

### Table: roles
- id (PK, UUID)
- name (unique, required)
- description
- permissions (JSON)
- created_at, updated_at (audit)

### Table: locations
- id (PK, UUID)
- organization_id (FK to organizations.id)
- name, location_type, description, building, floor, area
- latitude, longitude
- is_active (bool)
- created_at, updated_at, deleted_at (audit)

### Table: audit_logs
- id (PK, UUID)
- user_id (FK to users.id)
- organization_id (FK to organizations.id, nullable)
- action, entity_type, entity_id
- old_values (JSON), new_values (JSON)
- ip_address, user_agent
- created_at (audit)

### Table: visitor_details
- aadhaar_id (PK, String)
- full_name, gender, phone_number, location, purpose_of_visit, host_to_visit
- floors (ARRAY), towers (ARRAY)
- duration_from, duration_to
- created_at, updated_at (audit)

### Table: visitor_images
- id (PK, BigInteger)
- aadhaar_id (FK to visitor_details.aadhaar_id)
- angle, file_path
- created_at

## API Endpoints

### Authentication APIs

#### `/api/v2/auth/login` (POST)
**Request:** `{ "username": string, "password": string }`
**Response:** `{ "success": true, "message": "Login successful", "data": { "user": { ... }, "access_token": string, "refresh_token": string } }`
**Errors:** 400 (missing fields), 401 (invalid credentials), 500 (server error)

#### `/api/v2/auth/register` (POST)
**Request:** `{ "email": string, "username": string, "password": string, "role_id": string, "organization_id"?: string }`
**Response:** `{ "success": true, "message": "User registered successfully", "data": { "user": { ... } } }`
**Errors:** 400 (validation), 500 (server error)

#### `/api/v2/auth/refresh` (POST)
**Auth:** Bearer refresh token
**Response:** `{ "success": true, "message": "Token refreshed successfully", "data": { "access_token": string, "refresh_token": string } }`
**Errors:** 401 (expired), 500 (server error)

#### `/api/v2/auth/me` (GET)
**Auth:** Bearer access token
**Response:** `{ "success": true, "message": "Success", "data": { "user": { ... } } }`
**Errors:** 401 (expired), 500 (server error)

#### `/api/v2/auth/logout` (POST)
**Auth:** Bearer access token
**Response:** `{ "success": true, "message": "Logged out successfully" }`
**Errors:** 401 (expired), 500 (server error)

#### `/api/v2/auth/change-password` (POST)
**Auth:** Bearer access token
**Request:** `{ "old_password": string, "new_password": string }`
**Response:** `{ "success": true, "message": "Password changed successfully" }`
**Errors:** 400 (validation), 401 (expired), 500 (server error)

#### `/api/v2/auth/forgot-password` (POST)
**Request:** `{ "email": string }`
**Response:** `{ "success": true, "message": "If the email exists, a password reset link has been sent" }`

### Visitor APIs

#### `/api/visitors/suggest` (GET)
**Auth:** Bearer JWT or session cookie
**Query:** `q` (aadhaar prefix)
**Response:** `[ { "aadhaar_id": string, "full_name": string } ]`

#### `/api/visitors/<aadhaar_id>` (GET)
**Auth:** Bearer JWT or session cookie
**Response:** `{ "exists": bool, "visitor": { ... }, "images": { angle: url } }`

#### `/api/visitors/<aadhaar_id>/photos/<angle>` (POST)
**Auth:** Bearer JWT or session cookie, CSRF
**Request:** multipart/form-data (file)
**Response:** `{ "url": string }`

#### `/api/visitors/<aadhaar_id>/embeddings` (POST)
**Auth:** Bearer JWT or session cookie, CSRF
**Request:** multipart/form-data (file)
**Response:** `{ "status": "ok", "added_vectors": int, "aadhaar": string }`

#### `/api/visitors` (POST)
**Auth:** Bearer JWT or session cookie, CSRF
**Request:** `{ ...visitor fields... }`
**Response:** `{ ...visitor fields... }`

#### `/api/visitors/<visitor_id>/latest-image` (GET)
**Auth:** Bearer JWT or session cookie
**Response:** `{ "image_url": string }`

#### `/api/visitors/<visitor_id>` (DELETE)
**Auth:** Bearer JWT or session cookie, CSRF
**Response:** `{ "message": "Visitor deleted successfully" }`

#### `/api/visitors/<aadhaar_id>/preview` (GET)
**Auth:** Bearer JWT or session cookie
**Response:** `{ ...visitor preview fields... }`

### Meta APIs

#### `/api/meta/floors` (GET)
**Auth:** Bearer JWT or session cookie
**Response:** `[ "G", "1", ..., "15" ]`

#### `/api/meta/towers` (GET)
**Auth:** Bearer JWT or session cookie
**Response:** `[ "A", "B", "C", "D" ]`

### Stats APIs

#### `/api/stats/overview` (GET)
**Auth:** Bearer JWT or session cookie
**Response:**
```
{
  "organizations": { "total": int, "active": int },
  "employees": { "total": int, "active": int },
  "face_embeddings": { "total": int, "primary": int, "avg_quality": float },
  "presence_events": { "total": int, "unknown_faces": int, "anomalies": int, "pending_reviews": int },
  "cameras": { "total": int, "online": int },
  "visitors": { "total": int }
}
```

#### `/api/stats/visitors/count` (GET)
**Auth:** Bearer JWT or session cookie
**Response:** `{ "count": int }`

#### `/api/debug/token` (GET)
**Auth:** Bearer JWT
**Response:** `{ "success": true, "identity": "user_id", "claims": { ...JWT claims... } }`

### Common APIs

#### `/api/csrf` (GET)
**Response:** `{ "csrfToken": string }` (sets cookie)

#### `/healthz` (GET)
**Response:** `{ "status": "ok" }`

---

## Notes
- All endpoints expect authentication via JWT or session cookie unless noted.
- Foreign key relations exist between employees and organizations, employees and face_embeddings, employees and presence_events, etc.
- All response types are JSON.
- For more details on each table, see your SQLAlchemy model definitions above.
