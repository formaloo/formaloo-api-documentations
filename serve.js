#!/usr/bin/env node

/**
 * Simple HTTP Server for Formaloo API Documentation
 * 
 * This script serves the HTML documentation locally to avoid CORS issues
 * when developing or testing the documentation.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

// Default file to serve for directory requests
const defaultFiles = ['index.html', 'latest.html'];

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Remove leading slash and decode URL
  pathname = decodeURIComponent(pathname.substring(1));
  
  // Handle root path
  if (pathname === '' || pathname === '/') {
    pathname = 'latest.html';
  }
  
  // Security: prevent directory traversal
  if (pathname.includes('..') || pathname.includes('~')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden: Directory traversal not allowed');
    return;
  }
  
  // Try to find the file
  let filePath = path.join(__dirname, 'html', pathname);
  
  // If file doesn't exist, try without 'html' directory
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, pathname);
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // Try default files for directory requests
    if (pathname.endsWith('/') || pathname === '') {
      for (const defaultFile of defaultFiles) {
        const defaultPath = path.join(__dirname, 'html', defaultFile);
        if (fs.existsSync(defaultPath)) {
          filePath = defaultPath;
          break;
        }
      }
    }
    
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - File Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <h1>404 - File Not Found</h1>
          <p>The requested file "${pathname}" was not found.</p>
          <p><a href="/">Go to Documentation</a></p>
        </body>
        </html>
      `);
      return;
    }
  }
  
  // Check if it's a directory
  if (fs.statSync(filePath).isDirectory()) {
    // Try to serve index.html or latest.html from directory
    for (const defaultFile of defaultFiles) {
      const indexPath = path.join(filePath, defaultFile);
      if (fs.existsSync(indexPath)) {
        filePath = indexPath;
        break;
      }
    }
  }
  
  // Get file extension and set content type
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  // Set CORS headers to allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Read and serve the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Formaloo API Documentation Server`);
  console.log(`📡 Server running at http://${HOST}:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'html')}`);
  console.log(`🌐 Open http://${HOST}:${PORT} in your browser`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   - http://${HOST}:${PORT}/ (latest documentation)`);
  console.log(`   - http://${HOST}:${PORT}/latest.html`);
  console.log(`   - http://${HOST}:${PORT}/v3.0.html`);
  console.log(`   - http://${HOST}:${PORT}/openapi-v3.0.yaml`);
  console.log(`\n🛑 Press Ctrl+C to stop the server`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port:`);
    console.error(`   PORT=8081 node serve.js`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

module.exports = server;
