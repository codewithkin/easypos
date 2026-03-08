# Admin Manual Plan Setup Endpoint

## Overview
This endpoint allows you to manually set up a plan for an organization, bypassing the payment system. This is useful for testing, trial periods, or in-person payments.

**Endpoint**: `POST /api/admin/setup-plan`

**Authentication**: Password-protected (no JWT required)

---

## Request

### URL
```
POST http://localhost:3000/api/admin/setup-plan
```

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "password": "exyro45610y2627291",
  "orgId": "org_xxxxxxxxxxxxx",
  "plan": "growth"
}
```

### Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | string | ✅ | Admin password (case-sensitive: `exyro45610y2627291`) |
| `orgId` | string | ✅ | Organization ID to update |
| `plan` | string | ✅ | Plan name: `starter`, `growth`, or `enterprise` |

---

## Response

### Success (200 OK)
```json
{
  "success": true,
  "message": "Organization \"Acme Corp\" has been set up with the growth plan",
  "org": {
    "id": "org_xxxxxxxxxxxxx",
    "name": "Acme Corp",
    "plan": "growth",
    "maxUsers": 12,
    "maxMonthlyInvoices": 2500,
    "maxProducts": 700,
    "maxCategories": 150,
    "maxBranches": 3,
    "billingCycleStart": "2026-03-08T10:30:00.000Z",
    "nextBillingDate": "2026-04-07T10:30:00.000Z"
  }
}
```

### Error Responses

**Invalid password (401 Unauthorized)**
```json
{
  "error": "Invalid password"
}
```

**Organization not found (404 Not Found)**
```json
{
  "error": "Organization not found"
}
```

**Validation error (400 Bad Request)**
```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_enum_value",
      "options": ["starter", "growth", "enterprise"],
      "path": ["plan"],
      "message": "Invalid enum value"
    }
  ]
}
```

---

## Plan Limits Reference

When you call this endpoint, the organization is automatically granted these limits:

### Starter Plan
- **Users**: 5
- **Monthly Invoices**: 1,000
- **Products**: 300
- **Categories**: 50
- **Branches**: 1

### Growth Plan
- **Users**: 12
- **Monthly Invoices**: 2,500
- **Products**: 700
- **Categories**: 150
- **Branches**: 3

### Enterprise Plan
- **Users**: 20
- **Monthly Invoices**: 10,000
- **Products**: 1,850
- **Categories**: 500
- **Branches**: 10

---

## Billing Behavior

When you call this endpoint:

1. ✅ The organization's **plan** is set to the requested plan
2. ✅ All **resource limits** are updated to match the plan
3. ✅ **Billing cycle start date** is set to now
4. ✅ **Next billing date** is set to 30 days from now (waives payment for 1 month)
5. ✅ **Usage counters** are reset to 0
6. ✅ **Pending overage charges** are cleared

The organization will be charged/prompted for payment on `nextBillingDate`.

---

## Example cURL Request

```bash
curl -X POST http://localhost:3000/api/admin/setup-plan \
  -H "Content-Type: application/json" \
  -d '{
    "password": "exyro45610y2627291",
    "orgId": "clzxxx123",
    "plan": "growth"
  }'
```

---

## Example JavaScript/Fetch Request

```javascript
const response = await fetch('http://localhost:3000/api/admin/setup-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    password: 'exyro45610y2627291',
    orgId: 'clzxxx123',
    plan: 'growth'
  })
});

const data = await response.json();
console.log(data);
```

---

## Security Notes

⚠️ **This endpoint is protected by a password, not JWT.** This means:
- Anyone with the correct password can call it
- Keep the password **secret** and **never commit it** to public repositories
- Consider adding IP whitelisting or rate limiting in production
- This is designed for admin/developer use only during setup and testing

---

## Testing Locally

If you're running the server locally:
```bash
# Development server (usually runs on port 3000)
http://localhost:3000/api/admin/setup-plan
```

If you're deploying to a server:
```bash
# Replace with your actual server URL
https://your-api-domain.com/api/admin/setup-plan
```
