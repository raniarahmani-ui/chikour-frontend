# Swapie Admin Backend API

A comprehensive PHP REST API backend for the Swapie admin dashboard system.

## Features

- **Admin Authentication** - JWT-based authentication system
- **User Management** - Activate, suspend, edit users
- **Service Management** - Full CRUD operations for services
- **Demand Management** - Full CRUD operations for demands
- **Category Management** - Create, activate, suspend categories
- **Transaction Management** - System-wide transaction oversight
- **Dashboard Statistics** - Global system summary and analytics

## Requirements

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- PDO PHP extension

## Installation

### 1. Database Setup

```bash

mysql -u root -p < database/schema.sql
```

### 2. Configuration

Edit `config/database.php` with your database credentials:

```php
private $host = "localhost";
private $database = "swapie_db";
private $username = "your_username";
private $password = "your_password";
```

Edit `config/config.php` to set your JWT secret:

```php
define('JWT_SECRET', 'your-super-secret-key-change-in-production');
```

### 3. Apache Configuration

Add to your `.htaccess` or Apache config:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

### 4. Create logs directory

```bash
mkdir logs
chmod 755 logs
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/logout` | Admin logout |
| POST | `/api/auth/refresh` | Refresh JWT token |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (paginated) |
| GET | `/api/users/{id}` | Get user details |
| GET | `/api/users/{id}/details` | Get user with full activity |
| PUT | `/api/users/{id}` | Update user |
| PATCH | `/api/users/{id}/status` | Update user status |
| PATCH | `/api/users/{id}/balance` | Adjust user balance |
| DELETE | `/api/users/{id}` | Delete user |

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List all services |
| GET | `/api/services/{id}` | Get service details |
| GET | `/api/services/{id}/reviews` | Get service with reviews |
| GET | `/api/services/stats` | Get service statistics |
| PUT | `/api/services/{id}` | Update service |
| PATCH | `/api/services/{id}/status` | Update service status |
| PATCH | `/api/services/{id}/featured` | Toggle featured status |
| DELETE | `/api/services/{id}` | Delete service |

### Demands

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/demands` | List all demands |
| GET | `/api/demands/{id}` | Get demand details |
| GET | `/api/demands/{id}/proposals` | Get demand with proposals |
| GET | `/api/demands/stats` | Get demand statistics |
| PUT | `/api/demands/{id}` | Update demand |
| PATCH | `/api/demands/{id}/status` | Update demand status |
| DELETE | `/api/demands/{id}` | Delete demand |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/tree` | Get categories as tree |
| GET | `/api/categories/{id}` | Get category details |
| GET | `/api/categories/stats` | Get category statistics |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/{id}` | Update category |
| PATCH | `/api/categories/{id}/status` | Update category status |
| POST | `/api/categories/reorder` | Reorder categories |
| DELETE | `/api/categories/{id}` | Delete category |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List all transactions |
| GET | `/api/transactions/{id}` | Get transaction details |
| GET | `/api/transactions/stats` | Get transaction statistics |
| GET | `/api/transactions/volume` | Get volume over time |
| GET | `/api/transactions/by-type` | Get by type breakdown |
| GET | `/api/transactions/top-users` | Get top users |
| PATCH | `/api/transactions/{id}/status` | Update status |
| PATCH | `/api/transactions/{id}/refund` | Refund transaction |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Full dashboard data |
| GET | `/api/dashboard/overview` | Summary statistics |
| GET | `/api/dashboard/activity` | Recent activity |
| GET | `/api/dashboard/charts` | Chart data |
| GET | `/api/dashboard/alerts` | System alerts |

### Admins (Super Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admins` | List all admins |
| GET | `/api/admins/{id}` | Get admin details |
| GET | `/api/admins/logs` | Get activity logs |
| POST | `/api/admins` | Create admin |
| PUT | `/api/admins/{id}` | Update admin |
| DELETE | `/api/admins/{id}` | Delete admin |

## Query Parameters

### Pagination

```
?page=1&per_page=20
```

### Filtering

```
?status=active&search=keyword&from_date=2024-01-01&to_date=2024-12-31
```

## Authentication

All endpoints (except login) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Default Admin Credentials

- Email: `admin@swapie.com`
- Password: `admin123`

**⚠️ Change these credentials immediately in production!**

## Response Format

### Success Response

```json
{
    "success": true,
    "message": "Success message",
    "data": { ... },
    "timestamp": "2024-01-01T00:00:00+00:00"
}
```

### Error Response

```json
{
    "success": false,
    "message": "Error message",
    "errors": [],
    "timestamp": "2024-01-01T00:00:00+00:00"
}
```

### Paginated Response

```json
{
    "success": true,
    "data": [...],
    "pagination": {
        "current_page": 1,
        "per_page": 20,
        "total_items": 100,
        "total_pages": 5,
        "has_next": true,
        "has_prev": false
    },
    "timestamp": "2024-01-01T00:00:00+00:00"
}
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- SQL injection prevention via PDO prepared statements
- XSS prevention via input sanitization
- CORS configuration
- Role-based access control
- Admin activity logging

## Project Structure

```
backend/
├── api/
│   ├── auth.php
│   ├── users.php
│   ├── services.php
│   ├── demands.php
│   ├── categories.php
│   ├── transactions.php
│   ├── dashboard.php
│   └── admins.php
├── config/
│   ├── config.php
│   └── database.php
├── database/
│   └── schema.sql
├── middleware/
│   └── AuthMiddleware.php
├── models/
│   ├── Admin.php
│   ├── Category.php
│   ├── Demand.php
│   ├── Service.php
│   ├── Transaction.php
│   └── User.php
├── utils/
│   ├── JWT.php
│   ├── Response.php
│   └── Validator.php
├── logs/
├── .htaccess
├── index.php
└── README.md
```

## License

MIT License
