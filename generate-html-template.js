#!/usr/bin/env node

/**
 * HTML Template Generator for Formaloo API Documentation
 * 
 * This script generates HTML files for different API versions
 * with consistent styling and functionality.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  versions: [
    { version: 'latest', title: 'Formaloo API Documentation', specFile: 'openapi-v3.0.yaml' },
    { version: 'v3.0', title: 'Formaloo API Documentation v3.0', specFile: 'openapi-v3.0.yaml' },
    { version: 'v2.0', title: 'Formaloo API Documentation v2.0', specFile: 'openapi-v2.0.yaml' },
    { version: 'v1.0', title: 'Formaloo API Documentation v1.0', specFile: 'openapi-v1.0.yaml' }
  ],
  outputDir: './',
  templateDir: './templates'
};

// HTML Template
const generateHTML = (version, title, specFile) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, shrink-to-fit=no"
    />
    <title>${title}</title>
    <meta name="description" content="Complete API documentation for Formaloo's platform services ${version !== 'latest' ? version : 'v3.0'} including Forms, Authentication, Storage, AI, and Identity management.">
    
    <!-- Favicons and PWA -->
    <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/favicon-16x16.png">
    <link rel="manifest" href="assets/site.webmanifest">
    <meta name="theme-color" content="#ffffff">

    <!-- Stoplight Elements -->
    <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/@stoplight/elements/styles.min.css"
    />

    <!-- Custom Styles -->
    <style>
      :root {
        --primary-color: #2563eb;
        --primary-hover: #1d4ed8;
        --secondary-color: #64748b;
        --success-color: #10b981;
        --warning-color: #f59e0b;
        --error-color: #ef4444;
        --background-color: #ffffff;
        --surface-color: #f8fafc;
        --border-color: #e2e8f0;
        --text-primary: #1e293b;
        --text-secondary: #64748b;
        --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        --border-radius: 8px;
        --transition: all 0.2s ease-in-out;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        background-color: var(--background-color);
        color: var(--text-primary);
        line-height: 1.6;
      }

      /* Header */
      .header {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
        color: white;
        padding: 1rem 2rem;
        box-shadow: var(--shadow-md);
        position: sticky;
        top: 0;
        z-index: 1000;
      }

      .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1400px;
        margin: 0 auto;
      }

      .logo-section {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .logo {
        height: 40px;
        width: auto;
      }

      .header-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
      }

      .header-subtitle {
        font-size: 0.875rem;
        opacity: 0.9;
        margin: 0;
      }

      ${version !== 'latest' ? `.version-badge {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-left: 0.5rem;
      }` : ''}

      /* Search Container */
      .search-container {
        position: relative;
        max-width: 400px;
        width: 100%;
      }

      .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: none;
        border-radius: var(--border-radius);
        background-color: rgba(255, 255, 255, 0.95);
        color: var(--text-primary);
        font-size: 0.875rem;
        transition: var(--transition);
        box-shadow: var(--shadow-sm);
      }

      .search-input:focus {
        outline: none;
        background-color: white;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        transform: translateY(-1px);
      }

      .search-input::placeholder {
        color: var(--text-secondary);
      }

      .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        pointer-events: none;
      }

      .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        margin-top: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1001;
        display: none;
      }

      .search-result-item {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: var(--transition);
      }

      .search-result-item:hover {
        background-color: var(--surface-color);
      }

      .search-result-item:last-child {
        border-bottom: none;
      }

      /* Loading States */
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 2rem;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-text {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      /* Error States */
      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 2rem;
        text-align: center;
      }

      .error-icon {
        width: 64px;
        height: 64px;
        color: var(--error-color);
        margin-bottom: 1rem;
      }

      .error-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .error-message {
        color: var(--text-secondary);
        margin-bottom: 1.5rem;
      }

      .retry-button {
        background-color: var(--primary-color);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: var(--border-radius);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
      }

      .retry-button:hover {
        background-color: var(--primary-hover);
        transform: translateY(-1px);
      }

      /* API Container */
      .api-container {
        position: relative;
        min-height: calc(100vh - 80px);
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .header {
          padding: 1rem;
        }

        .header-content {
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
        }

        .search-container {
          max-width: none;
        }

        .header-title {
          font-size: 1.25rem;
        }

        .header-subtitle {
          font-size: 0.8rem;
        }
      }

      @media (max-width: 480px) {
        .header {
          padding: 0.75rem;
        }

        .logo-section {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .search-input {
          padding: 0.625rem 0.875rem 0.625rem 2.25rem;
          font-size: 0.8rem;
        }
      }

      /* Custom Stoplight Elements Styling */
      elements-api {
        --sl-color-primary: var(--primary-color);
        --sl-color-primary-hover: var(--primary-hover);
        --sl-color-bg: var(--background-color);
        --sl-color-bg-secondary: var(--surface-color);
        --sl-color-text: var(--text-primary);
        --sl-color-text-secondary: var(--text-secondary);
        --sl-color-border: var(--border-color);
        --sl-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      }

      /* Accessibility */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Focus styles */
      *:focus {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }

      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
      }
    </style>
  </head>
  <body>
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <img src="assets/logo.svg" alt="Formaloo Logo" class="logo" />
          <div>
            <h1 class="header-title">
              ${title.replace(version !== 'latest' ? ` ${version}` : '', '')}
              ${version !== 'latest' ? `<span class="version-badge">${version}</span>` : ''}
            </h1>
            <p class="header-subtitle">Complete API reference for all Formaloo services</p>
          </div>
        </div>
        
        <div class="search-container">
          <div class="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search endpoints, methods, or descriptions..."
            name="search"
            id="search"
            class="search-input"
            autocomplete="off"
            aria-label="Search API documentation"
          />
          <div class="search-results" id="search-results"></div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div class="loading-container" id="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading API documentation...</p>
    </div>

    <!-- Error State -->
    <div class="error-container" id="error-container" style="display: none;">
      <div class="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </div>
      <h2 class="error-title">Failed to Load Documentation</h2>
      <p class="error-message">Unable to load the API specification. Please check your connection and try again.</p>
      <button class="retry-button" onclick="retryLoad()">Retry</button>
    </div>

    <!-- API Documentation -->
    <div class="api-container" id="api-container" style="display: none;">
      <elements-api
        id="elements-api"
        apiDescriptionUrl="${specFile}"
        logo="assets/logo.svg"
        router="hash"
        layout="sidebar"
        hideTryItPanel="false"
        hideDownloadButton="false"
        hideInternal="false"
        hideExport="false"
        hideSchemas="false"
        hideInternalOperations="false"
        hideTryIt="false"
      />
    </div>

    <script>
      // Enhanced search functionality
      class APIDocumentation {
        constructor() {
          this.searchInput = document.getElementById('search');
          this.searchResults = document.getElementById('search-results');
          this.loadingContainer = document.getElementById('loading-container');
          this.errorContainer = document.getElementById('error-container');
          this.apiContainer = document.getElementById('api-container');
          this.elementsApi = document.getElementById('elements-api');
          
          this.searchTimeout = null;
          this.isLoaded = false;
          
          this.init();
        }

        init() {
          this.setupEventListeners();
          this.loadAPI();
        }

        setupEventListeners() {
          // Search functionality
          this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
              this.handleSearch(e.target.value);
            }, 300);
          });

          // Hide search results when clicking outside
          document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
              this.hideSearchResults();
            }
          });

          // Handle search result clicks
          this.searchResults.addEventListener('click', (e) => {
            if (e.target.classList.contains('search-result-item')) {
              this.navigateToResult(e.target.dataset.path);
              this.hideSearchResults();
            }
          });

          // Keyboard navigation
          this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              this.hideSearchResults();
              this.searchInput.blur();
            }
          });
        }

        async loadAPI() {
          try {
            this.showLoading();
            
            // Check if API spec exists - use relative path to avoid CORS issues
            const specUrl = '${specFile}';
            const response = await fetch(specUrl);
            if (!response.ok) {
              throw new Error(\`API specification not found: \${response.status} \${response.statusText}\`);
            }

            // Wait for elements-api to load
            await this.waitForElementsAPI();
            
            this.hideLoading();
            this.showAPI();
            this.isLoaded = true;
            
          } catch (error) {
            console.error('Failed to load API documentation:', error);
            this.showError();
          }
        }

        waitForElementsAPI() {
          return new Promise((resolve) => {
            const checkLoaded = () => {
              if (this.elementsApi && this.elementsApi.shadowRoot) {
                resolve();
              } else {
                setTimeout(checkLoaded, 100);
              }
            };
            checkLoaded();
          });
        }

        handleSearch(query) {
          if (!query.trim()) {
            this.hideSearchResults();
            return;
          }

          if (!this.isLoaded) {
            return;
          }

          // Enhanced search logic
          const results = this.searchInAPI(query);
          this.displaySearchResults(results);
        }

        searchInAPI(query) {
          const results = [];
          const searchTerm = query.toLowerCase();
          
          // This is a simplified search - in a real implementation,
          // you'd want to search through the actual API spec data
          const commonEndpoints = [
            { path: '/${version !== 'latest' ? version : 'v3.0'}/forms', method: 'GET', description: 'List all forms' },
            { path: '/${version !== 'latest' ? version : 'v3.0'}/forms/{slug}', method: 'GET', description: 'Get form details' },
            { path: '/${version !== 'latest' ? version : 'v3.0'}/forms', method: 'POST', description: 'Create new form' },
            { path: '/${version !== 'latest' ? version : 'v3.0'}/forms/{slug}', method: 'PUT', description: 'Update form' },
            { path: '/${version !== 'latest' ? version : 'v3.0'}/forms/{slug}', method: 'DELETE', description: 'Delete form' },
            { path: '/${version !== 'latest' ? version : 'v3.0'}/auth/login', method: 'POST', description: 'User authentication' },
            { path: '/${version !== 'latest' ? version : 'v3.0'}/auth/register', method: 'POST', description: 'User registration' },
            { path: '/${version !== 'latest' ? version : 'v3.0'}/storage/files', method: 'GET', description: 'List files' },
            { path: '/${version !== 'latest' ? version : 'v3.0'}/storage/files', method: 'POST', description: 'Upload file' },
            { path: '/${version !== 'latest' ? version : 'v3.0'}/ai/chat', method: 'POST', description: 'AI chat completion' }
          ];

          commonEndpoints.forEach(endpoint => {
            if (
              endpoint.path.toLowerCase().includes(searchTerm) ||
              endpoint.method.toLowerCase().includes(searchTerm) ||
              endpoint.description.toLowerCase().includes(searchTerm)
            ) {
              results.push(endpoint);
            }
          });

          return results.slice(0, 10); // Limit to 10 results
        }

        displaySearchResults(results) {
          if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
          } else {
            this.searchResults.innerHTML = results.map(result => \`
              <div class="search-result-item" data-path="\${result.path}">
                <div style="font-weight: 500; color: var(--text-primary);">
                  <span style="color: var(--primary-color); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">\${result.method}</span>
                  \${result.path}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                  \${result.description}
                </div>
              </div>
            \`).join('');
          }
          
          this.showSearchResults();
        }

        showSearchResults() {
          this.searchResults.style.display = 'block';
        }

        hideSearchResults() {
          this.searchResults.style.display = 'none';
        }

        navigateToResult(path) {
          // Navigate to the specific endpoint in the API documentation
          if (this.elementsApi && this.elementsApi.navigateTo) {
            this.elementsApi.navigateTo(path);
          }
        }

        showLoading() {
          this.loadingContainer.style.display = 'flex';
          this.errorContainer.style.display = 'none';
          this.apiContainer.style.display = 'none';
        }

        hideLoading() {
          this.loadingContainer.style.display = 'none';
        }

        showError() {
          this.loadingContainer.style.display = 'none';
          this.apiContainer.style.display = 'none';
          this.errorContainer.style.display = 'flex';
        }

        showAPI() {
          this.loadingContainer.style.display = 'none';
          this.errorContainer.style.display = 'none';
          this.apiContainer.style.display = 'block';
        }
      }

      // Global retry function
      function retryLoad() {
        window.apiDoc = new APIDocumentation();
      }

      // Initialize when DOM is loaded
      document.addEventListener('DOMContentLoaded', () => {
        window.apiDoc = new APIDocumentation();
      });

      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.apiDoc && !window.apiDoc.isLoaded) {
          window.apiDoc.loadAPI();
        }
      });
    </script>
  </body>
</html>`;

// Main function
function generateHTMLFiles() {
  console.log('🚀 Generating HTML files for Formaloo API Documentation...\n');

  config.versions.forEach(({ version, title, specFile }) => {
    const fileName = version === 'latest' ? 'latest.html' : `${version}.html`;
    const filePath = path.join(config.outputDir, fileName);
    
    try {
      const htmlContent = generateHTML(version, title, specFile);
      fs.writeFileSync(filePath, htmlContent, 'utf8');
      console.log(`✅ Generated: ${fileName}`);
    } catch (error) {
      console.error(`❌ Error generating ${fileName}:`, error.message);
    }
  });

  console.log('\n🎉 HTML generation complete!');
  console.log('\nGenerated files:');
  config.versions.forEach(({ version }) => {
    const fileName = version === 'latest' ? 'latest.html' : `${version}.html`;
    console.log(`  - ${fileName}`);
  });
}

// Run if called directly
if (require.main === module) {
  generateHTMLFiles();
}

module.exports = { generateHTML, generateHTMLFiles, config };
