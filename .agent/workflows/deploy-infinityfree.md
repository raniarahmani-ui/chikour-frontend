---
description: How to host the project on InfinityFree
---

# 🚀 Hosting on InfinityFree

Follow these steps to host your **Swapie** project on InfinityFree.

## 1. Prepare for Deployment

Before uploading, we need to build the frontend and configure the backend.

### A. Build the Frontend
1. Open a terminal in the `frontend` directory.
2. Run: `npm run build`
3. This will create a `dist` folder. The contents of this folder will be your website's public files.

### B. Configure Backend
1. Go to `backend/config/database.php`.
2. Change `$mode = 'local';` to `$mode = 'hosting';`.
3. Update the `prodHost`, `prodDatabase`, `prodUsername`, and `prodPassword` with the details provided by InfinityFree (found in your Control Panel under "MySQL Databases").

## 2. Setting up the Database on InfinityFree

1. Log in to your **InfinityFree Control Panel**.
2. Go to **MySQL Databases**.
3. Create a new database (e.g., `swapie`).
4. Note down the **DB Name**, **DB User**, and **DB Password**.
5. Click on **phpMyAdmin** for that database.
6. Click the **Import** tab.
7. Choose the file `backend/database/schema.sql` from your project and click **Go**.

## 3. Uploading Files via FTP

You need an FTP client like **FileZilla** or use the online **File Manager**.

### Structure on InfinityFree (`htdocs` folder):
You should combine the build and the backend as follows:

1. **Frontend**: Upload all files *inside* `frontend/dist/` directly into the `htdocs/` folder.
   - `index.html` should be in `htdocs/index.html`.
   - `assets/` folder should be in `htdocs/assets/`.

2. **Backend**: Create a folder named `api` inside `htdocs/`.
   - Upload all contents of the `backend/` folder into `htdocs/api/`.
   - `htdocs/api/index.php` should exist.
   - `htdocs/api/.htaccess` should exist.

### Resulting Structure:
```text
htdocs/
├── index.html       (from frontend/dist)
├── assets/          (from frontend/dist)
└── api/             (your backend files)
    ├── index.php
    ├── .htaccess
    ├── config/
    ├── api/
    └── ...
```

## 4. Final Adjustments

### Update CORS in Backend
In `htdocs/api/config/config.php`, update `ALLOWED_ORIGINS` to include your InfinityFree URL:
```php
define('ALLOWED_ORIGINS', [
    'http://your-domain.infinityfreeapp.com',
    'https://your-domain.infinityfreeapp.com',
    'http://localhost:5173'
]);
```

### Enable SSL (Optional but Recommended)
InfinityFree provides free SSL via the "Free SSL Certificates" menu in the Client Area. This will change your site from `http://` to `https://`.

## 5. Troubleshooting

- **404 Errors on Pages**: If you refresh a page (like `/login`) and get a 404, you may need a `.htaccess` in the root `htdocs` folder to handle React Router.
  
  Create a `.htaccess` in `htdocs/` with:
  ```apache
  Options -MultiViews
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [QSA,L]
  ```
- **White Screen**: Check the browser console (F12) for errors. Often it's a mismatch in the API URL.
