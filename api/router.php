<?php
/**
 * Router for PHP Built-in Development Server
 * Routes all requests through index.php
 */
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// If requesting a real file (not PHP), let server handle it
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    $ext = pathinfo($uri, PATHINFO_EXTENSION);
    
    // If it's a PHP file, require it directly
    if ($ext === 'php') {
        require __DIR__ . $uri;
        return true;
    }
    
    // For other files (css, js, images), let server handle
    return false;
}

// Route everything else through index.php
require __DIR__ . '/index.php';
