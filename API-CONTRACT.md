# API Contract

## Base URL
- Development: `http://localhost:5000/api`
- Production: (to be added later)

## Authentication Endpoints

### POST /api/register
Register a new user

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword",
  "age": 25,
  "gender": "Male"  // "Male", "Female", or "Other"
}