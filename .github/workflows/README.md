# 🌾 KrishiMitra

> AI-powered crop price forecasting & decision support platform for Indian farmers.

[![CI](https://github.com/Ajay810710/krishimitra/actions/workflows/ci.yml/badge.svg)](https://github.com/Ajay810710/krishimitra/actions)

## What is KrishiMitra?

KrishiMitra helps small and medium Indian farmers decide **what to plant** by predicting
future crop prices at harvest time — before a single seed is sown.

A farmer enters their crop, location, land size, and planting date.
KrishiMitra returns a predicted price range, estimated profit, demand trend,
and weather risk — powered by real mandi data and AI forecasting models.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 14 + TypeScript + Tailwind |
| Backend | NestJS + TypeScript + Prisma |
| AI Engine | FastAPI + Python + Prophet + XGBoost |
| Database | PostgreSQL (Supabase) |
| Cache | Redis (Upstash) |
| Auth | Better Auth |
| Containers | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Hosting | Vercel + Railway + Render |

## Monorepo Structure