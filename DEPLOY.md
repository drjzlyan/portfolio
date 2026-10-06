# Deployment Guide — drjzlyan.com

This site deploys to GitHub Pages via the `.github/workflows/deploy.yml` workflow.

## GitHub Pages Setup

1. Go to **repo Settings → Pages**
2. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
3. The workflow will trigger on every push to `main`

## DNS Configuration

Configure these DNS records with your domain registrar:

### Apex domain (`drjzlyan.com`)

| Type | Name  | Value                    |
|------|-------|--------------------------|
| A    | `@`   | `185.199.108.153`        |
| A    | `@`   | `185.199.109.153`        |
| A    | `@`   | `185.199.110.153`        |
| A    | `@`   | `185.199.111.153`        |

### www subdomain

| Type  | Name  | Value                        |
|-------|-------|------------------------------|
| CNAME | `www` | `drjzlyan.github.io`   |

## HTTPS

After DNS propagates and GitHub Pages provisions the certificate:

1. Go to **repo Settings → Pages**
2. Check **Enforce HTTPS**

## Custom Domain

The `public/CNAME` file contains `drjzlyan.com`. Vite copies all `public/` files to `dist/`, so the CNAME will be present in the build output automatically.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview  # serves dist/ locally
```
