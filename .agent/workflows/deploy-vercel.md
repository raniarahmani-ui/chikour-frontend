---
description: How to host the project on Vercel
---

# 📐 Hosting on Vercel

Vercel is excellent for React apps, and we can also use it to host your PHP backend using a custom runtime.

## 1. Project Configuration

I have already created a `vercel.json` in your root directory. This file tells Vercel:
- To use the **PHP runtime** for your backend.
- To route any request starting with `/api` to your `backend/index.php`.
- To treat the rest as your React frontend.

## 2. Deploying via Vercel Dashboard

1.  Push your code to a **GitHub repository**.
2.  Log in to [Vercel](https://vercel.com).
3.  Click **Add New...** > **Project**.
4.  Import your GitHub repository.
5.  In the **Configure Project** screen:
    - **Keep "Root Directory" as your project root** (the folder containing `frontend` and `backend`).
    - **Build and Output Settings**:
        - **Build Command**: `cd frontend && npm install && npm run build`
        - **Output Directory**: `frontend/dist`
        - **Install Command**: `cd frontend && npm install`
    - **Environment Variables**:
        - `VITE_API_BASE_URL`: (Optional) Leave empty to use relative `/api` path.

## 3. Database Connection

Vercel does **not** provide a MySQL database. You should continue using your **Railway** database.

1.  Ensure your `backend/config/database.php` mode is set correctly.
2.  If you set it to `remote`, it will use the Railway credentials I saw earlier.
3.  Make sure high-traffic connections are allowed in Railway.

## 4. CORS Setup

In `backend/config/config.php`, add your Vercel domain to the `ALLOWED_ORIGINS` list:
```php
define('ALLOWED_ORIGINS', [
    'https://your-project.vercel.app',
    'http://localhost:5173'
]);
```

## 5. Troubleshooting PHP on Vercel

If you get a 500 error on `/api` calls:
- Check the Vercel **Function Logs**.
- Ensure all PHP includes in `index.php` use absolute-like paths (e.g., `require_once __DIR__ . '/...'`).
- Vercel PHP runtime limits: Some PHP extensions might not be available by default.

## 📊 Summary of Structure on Vercel:
- **URL/** -> Serves the React Frontend.
- **URL/api/** -> Routes to the PHP Backend via `vercel-php`.
