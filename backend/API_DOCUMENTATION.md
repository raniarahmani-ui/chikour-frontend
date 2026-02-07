# Swapie Backend API Documentation
## New Features: Reports, Ratings, Notifications, Public Profile & Error Handling

---

## Table of Contents
1. [Reports API](#reports-api)
2. [Report Types API](#report-types-api)
3. [Ratings API](#ratings-api)
4. [Notifications API](#notifications-api)
5. [Public Profile API](#public-profile-api)
6. [Error Handling](#error-handling)

---

## Reports API

Base URL: `/api/reports`

### User Endpoints

#### Create a Report
```
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
    "report_type_id": 1,
    "reason": "This user is sending spam messages",
    "description": "Detailed description of the issue...",
    "reported_user_id": 123,       // OR
    "reported_service_id": 456,    // OR
    "reported_demand_id": 789,
    "evidence": ["https://example.com/screenshot1.png"],
    "priority": "medium"  // optional: low, medium, high, critical
}

Response: 201 Created
{
    "success": true,
    "message": "Report submitted successfully",
    "data": { ... report object ... }
}
```

#### Get My Reports
```
GET /api/reports/my?page=1&per_page=20
Authorization: Bearer <token>

Response: 200 OK
{
    "success": true,
    "data": [ ... reports array ... ],
    "pagination": { ... }
}
```

#### Get Report Types (Public)
```
GET /api/reports/types?entity_type=user

Response: 200 OK
{
    "success": true,
    "data": [
        { "id": 1, "name": "Spam", "slug": "spam", "description": "...", "entity_type": "all" },
        ...
    ]
}
```

### Admin Endpoints

#### List All Reports
```
GET /api/reports?status=pending&priority=high&report_type_id=1&entity_type=user&search=spam&page=1
Authorization: Bearer <admin_token>
```

#### Get Report Details
```
GET /api/reports/{id}
Authorization: Bearer <admin_token>
```

#### Update Report Status
```
PUT /api/reports/{id}/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "status": "under_review",  // pending, under_review, resolved, dismissed, escalated
    "admin_note": "Looking into this issue"
}
```

#### Resolve Report with Action
```
PUT /api/reports/{id}/resolve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "resolution_type": "warning_issued",  // warning_issued, content_removed, user_suspended, user_banned, no_action, duplicate
    "admin_note": "Warning issued to the user"
}
```

#### Add Internal Note
```
POST /api/reports/{id}/note
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "note": "Contacted the user for more information"
}
```

#### Get Report Statistics
```
GET /api/reports/statistics
Authorization: Bearer <admin_token>

Response: 200 OK
{
    "success": true,
    "data": {
        "by_status": { "pending": 15, "resolved": 120, ... },
        "by_priority": { "low": 10, "medium": 50, ... },
        "by_type": { "Spam": 30, "Harassment": 5, ... },
        "recent_daily": [...],
        "pending_count": 15
    }
}
```

---

## Report Types API

Base URL: `/api/report-types`

### Public Endpoints

#### List Report Types
```
GET /api/report-types?active_only=true&entity_type=user
```

### Admin Endpoints

#### Create Report Type
```
POST /api/report-types
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "name": "Price Gouging",
    "description": "Unreasonable pricing practices",
    "entity_type": "service",  // user, service, demand, all
    "is_active": true,
    "sort_order": 5
}
```

#### Update Report Type
```
PUT /api/report-types/{id}
Authorization: Bearer <admin_token>
```

#### Toggle Report Type Active Status
```
PUT /api/report-types/{id}/toggle
Authorization: Bearer <admin_token>
```

#### Reorder Report Types
```
PUT /api/report-types/reorder
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "order": [3, 1, 2, 5, 4]  // Array of IDs in desired order
}
```

#### Delete Report Type
```
DELETE /api/report-types/{id}
Authorization: Bearer <admin_token>
```

---

## Ratings API

Base URL: `/api/ratings`

### User Endpoints

#### Create a Rating
```
POST /api/ratings
Authorization: Bearer <token>
Content-Type: application/json

{
    "service_id": 123,
    "rating": 5,           // 1-5 stars
    "title": "Excellent service!",
    "review": "Detailed review text...",
    "pros": "Fast delivery, great communication",
    "cons": "None",
    "images": ["https://example.com/review-photo.jpg"]
}

Response: 201 Created
```

#### Get Service Ratings
```
GET /api/ratings/service/{service_id}?page=1&per_page=10&rating_filter=5&has_review=true&verified_only=true&sort=helpful

Response: 200 OK
{
    "success": true,
    "data": {
        "ratings": [...],
        "distribution": { "1": 2, "2": 5, "3": 10, "4": 25, "5": 58 },
        "pagination": { ... }
    }
}
```

#### Get Rating Summary for Service
```
GET /api/ratings/summary/{service_id}

Response: 200 OK
{
    "success": true,
    "data": {
        "total_ratings": 100,
        "average_rating": 4.5,
        "five_star": 58,
        "four_star": 25,
        ...
        "with_reviews": 75
    }
}
```

#### Get My Ratings
```
GET /api/ratings/my?page=1&per_page=10
Authorization: Bearer <token>
```

#### Get Ratings I've Received (Provider)
```
GET /api/ratings/provider/{provider_id}?page=1&per_page=10
```

#### Update My Rating
```
PUT /api/ratings/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
    "rating": 4,
    "review": "Updated review text"
}
```

#### Delete My Rating
```
DELETE /api/ratings/{id}
Authorization: Bearer <token>
```

#### Vote Rating as Helpful
```
POST /api/ratings/{id}/helpful
Authorization: Bearer <token>
Content-Type: application/json

{
    "is_helpful": true
}
```

#### Provider Responds to Rating
```
POST /api/ratings/{id}/response
Authorization: Bearer <token>  // Must be service provider
Content-Type: application/json

{
    "response": "Thank you for your feedback! We appreciate..."
}
```

### Admin Endpoints

#### List All Ratings
```
GET /api/ratings?status=active&rating=5&service_id=123&search=great&page=1
Authorization: Bearer <admin_token>
```

#### Update Rating Status
```
PUT /api/ratings/{id}/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "status": "hidden"  // active, hidden, pending, deleted
}
```

#### Toggle Featured Status
```
PUT /api/ratings/{id}/feature
Authorization: Bearer <admin_token>
```

---

## Notifications API

Base URL: `/api/notifications`

All endpoints require authentication.

### Get Notifications
```
GET /api/notifications?page=1&per_page=20&is_read=false&type=message&category=info
Authorization: Bearer <token>

Response: 200 OK
{
    "success": true,
    "data": {
        "notifications": [...],
        "unread_count": 5,
        "pagination": { ... }
    }
}
```

### Get Unread Notifications
```
GET /api/notifications/unread?limit=10
Authorization: Bearer <token>

Response: 200 OK
{
    "success": true,
    "data": {
        "notifications": [...],
        "total_unread": 5
    }
}
```

### Get Unread Count
```
GET /api/notifications/count
Authorization: Bearer <token>

Response: 200 OK
{
    "success": true,
    "data": { "unread_count": 5 }
}
```

### Get Notification Statistics
```
GET /api/notifications/stats
Authorization: Bearer <token>

Response: 200 OK
{
    "success": true,
    "data": {
        "counts": { "unread": 5, "read": 100, "total": 105 },
        "by_type": { "message": 50, "transaction": 30, ... }
    }
}
```

### Mark Single Notification as Read
```
PUT /api/notifications/{id}/read
Authorization: Bearer <token>

Response: 200 OK
{
    "success": true,
    "message": "Notification marked as read",
    "data": { "notification_id": 123, "is_read": true }
}
```

### Mark Multiple Notifications as Read
```
PUT /api/notifications/read-multiple
Authorization: Bearer <token>
Content-Type: application/json

{
    "ids": [1, 2, 3, 4, 5]
}

Response: 200 OK
{
    "success": true,
    "message": "5 notifications marked as read",
    "data": { "updated_count": 5, "requested_count": 5 }
}
```

### Mark All Notifications as Read
```
PUT /api/notifications/read-all
Authorization: Bearer <token>

Response: 200 OK
{
    "success": true,
    "message": "All notifications marked as read",
    "data": { "updated_count": 15 }
}
```

### Mark All of a Type as Read
```
PUT /api/notifications/read-type
Authorization: Bearer <token>
Content-Type: application/json

{
    "type": "message"  // message, transaction, service, demand, report, rating, system, promotion
}
```

### Delete Single Notification
```
DELETE /api/notifications/{id}
Authorization: Bearer <token>
```

### Delete All Read Notifications
```
DELETE /api/notifications/read
Authorization: Bearer <token>

Response: 200 OK
{
    "success": true,
    "message": "15 read notifications deleted",
    "data": { "deleted_count": 15 }
}
```

---

## Public Profile API

Base URL: `/api/profile`

### Get Public Profile by Username
```
GET /api/profile/{username}

Response: 200 OK
{
    "success": true,
    "data": {
        "id": 123,
        "username": "johndoe",
        "full_name": "John Doe",
        "avatar": "https://...",
        "bio": "Professional service provider...",
        "status": "active",
        "email_verified": true,
        "rating_avg": 4.8,
        "rating_count": 150,
        "service_count": 12,
        "demand_count": 5,
        "completed_transactions": 200,
        "member_since": "January 2024",
        "last_active": "Today",
        "can_report": true,
        "can_chat": true
    }
}
```

### Get Public Profile by ID
```
GET /api/profile/id/{user_id}
```

### Get User's Public Services
```
GET /api/profile/{username}/services?page=1&per_page=10

Response: 200 OK
{
    "success": true,
    "data": [...services...],
    "pagination": { ... }
}
```

### Get User's Received Ratings
```
GET /api/profile/{username}/ratings?page=1&per_page=10
```

### Get User Statistics
```
GET /api/profile/{username}/stats

Response: 200 OK
{
    "success": true,
    "data": {
        "user_id": 123,
        "username": "johndoe",
        "member_since": "2024-01-15 10:30:00",
        "rating_avg": 4.8,
        "rating_count": 150,
        "total_services": 12,
        "total_service_views": 5000,
        "total_orders": 200,
        "total_demands": 5,
        "rating_distribution": { "1": 2, "2": 5, "3": 10, "4": 33, "5": 100 }
    }
}
```

### Report User
```
POST /api/profile/{username}/report
Authorization: Bearer <token>
Content-Type: application/json

{
    "report_type_id": 2,
    "reason": "User is sending harassing messages",
    "description": "Detailed description...",
    "evidence": ["https://example.com/screenshot.png"]
}

Response: 201 Created
{
    "success": true,
    "message": "Report submitted successfully. Our team will review it shortly.",
    "data": { "report_id": 456, "status": "pending" }
}
```

### Start Chat with User
```
POST /api/profile/{username}/chat
Authorization: Bearer <token>
Content-Type: application/json

{
    "message": "Hi! I'm interested in your services...",
    "service_id": 123  // optional: link to specific service
}

Response: 201 Created
{
    "success": true,
    "message": "Message sent successfully",
    "data": {
        "message_id": 789,
        "conversation_with": {
            "id": 123,
            "username": "johndoe",
            "full_name": "John Doe",
            "avatar": "..."
        },
        "message": { ... message object ... }
    }
}
```

---

## Error Handling

### Error Response Format
All errors follow a consistent format:

```json
{
    "success": false,
    "message": "Human-readable error message",
    "errors": {
        "field_name": "Specific field error"
    },
    "timestamp": "2026-02-02T10:30:00+00:00"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 405 | Method Not Allowed |
| 409 | Conflict - Duplicate resource |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Logging

Errors are automatically logged to:
1. **File**: `backend/logs/error_YYYY-MM-DD.log`
2. **Database**: `error_logs` table (if configured)

Logged information includes:
- Error type and message
- File and line number
- Stack trace
- Request URI and method
- User/Admin ID (if authenticated)
- IP address and user agent

---

## Database Schema Updates

Run the following SQL file to add necessary tables:
```
backend/database/schema_updates.sql
```

This creates:
- `report_types` - Report categories
- `reports` - User reports (enhanced)
- `ratings` - Service ratings and reviews
- `rating_helpful_votes` - Helpful vote tracking
- `notifications` - User notifications (enhanced)
- `error_logs` - Error tracking

---

## Notification Types

| Type | Description |
|------|-------------|
| message | New message received |
| transaction | Payment/earning updates |
| service | Service status changes |
| demand | Demand status changes |
| report | Report status updates |
| rating | New rating received |
| system | System announcements |
| promotion | Promotional notifications |

## Notification Categories

| Category | Use Case |
|----------|----------|
| info | General information |
| success | Positive updates |
| warning | Important alerts |
| error | Error notifications |
| promotion | Marketing/promotional |
