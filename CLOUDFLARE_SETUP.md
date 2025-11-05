# Cloudflare Pages Setup

## 1. Create Cloudflare Pages Project

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Select "Direct Upload"
4. Name your project (e.g., `formaloo-api-docs`)
5. Complete creation

## 2. Get API Token

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template or create custom token with:
   - Permissions: `Account.Cloudflare Pages — Edit`
4. Copy the generated token

## 3. Get Account ID

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Find "Account ID" in the right sidebar
3. Copy the Account ID

## 4. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN`: Your API token from step 2
- `CLOUDFLARE_ACCOUNT_ID`: Your account ID from step 3
- `CLOUDFLARE_PROJECT_NAME`: Your project name from step 1

## 5. Branch Deployment

- Push to `master` → deploys to production (`your-project.pages.dev`)
- Push to `dev` → deploys to preview (`dev.your-project.pages.dev`)

