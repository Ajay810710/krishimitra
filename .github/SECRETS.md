# GitHub Actions — Required Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret** and add each secret below.

## Vercel (Web)
| Secret | How to get |
|--------|-----------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Run `vercel whoami` or check Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel → your project → Settings → General → Project ID |

## Render (API + AI)
| Secret | How to get |
|--------|-----------|
| `RENDER_DEPLOY_HOOK_API` | Render dashboard → krishimitra-api → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_AI` | Render dashboard → krishimitra-ai → Settings → Deploy Hook |

## App URLs (smoke tests)
| Secret | Example value |
|--------|--------------|
| `API_BASE_URL` | `https://krishimitra-api.onrender.com/api` |
| `WEB_BASE_URL` | `https://krishimitra.vercel.app` |
| `NEXT_PUBLIC_API_URL` | `https://krishimitra-api.onrender.com` |

## Pipeline Flow

```
Any branch push / PR
    └─► ci.yml  →  typecheck → lint → build → security audit

PR opened/updated against main
    └─► preview.yml  →  Vercel preview deploy → comment URL on PR

Merge to main
    └─► deploy.yml
          ├── build-check
          ├── deploy-api   →  Render deploy hook (API)
          ├── deploy-web   →  Vercel production deploy
          ├── deploy-ai    →  Render deploy hook (AI)
          ├── smoke-test   →  hit /health + public endpoints
          └── notify-failure (logs on any failure)
```

Manual trigger: Actions tab → Deploy → Run workflow → choose service (all/api/web/ai)
