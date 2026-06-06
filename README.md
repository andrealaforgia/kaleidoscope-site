# Kaleidoscope documentation site

[![CI](https://github.com/andrealaforgia/kaleidoscope-site/actions/workflows/ci.yml/badge.svg)](https://github.com/andrealaforgia/kaleidoscope-site/actions/workflows/ci.yml)

The documentation site for [Kaleidoscope](https://github.com/andrealaforgia/kaleidoscope),
an OpenTelemetry-compatible observability platform. Built with
[Astro Starlight](https://starlight.astro.build/) and designed to deploy on
Vercel.

The site is written for people evaluating or adopting Kaleidoscope as their
observability platform. It is deliberately honest about what works today versus
what is roadmap — that honesty is one of the project's core principles.

## Local development

Node 20+ (CI runs on Node 22) and npm are required.

```sh
npm install      # install dependencies
npm run dev      # local dev server at http://localhost:4321
npm run check    # type-check the project (astro check)
npm run build    # static build into ./dist
npm run preview  # preview the built site
```

## Continuous integration

Every push and pull request against `main` runs the
[CI workflow](.github/workflows/ci.yml) on GitHub Actions: it installs
dependencies with `npm ci`, type-checks with `astro check`, and builds the site.
A red build blocks nothing automatically, but it is the signal that something
needs fixing before deploy.

## Content

All pages live under `src/content/docs/` as Markdown / MDX. The sidebar is
defined in `astro.config.mjs`. Mermaid diagrams are written as fenced
` ```mermaid ` code blocks and rendered client-side (see
`src/plugins/remark-mermaid.mjs` and `src/components/Head.astro`), so the build
needs no headless browser and runs anywhere.

## Deploying to Vercel

This is a static Astro site, so deployment is zero-config:

1. Push this repository to GitHub (or GitLab / Bitbucket).
2. In Vercel, **Add New → Project** and import the repository.
3. Vercel auto-detects the **Astro** framework preset. Leave the defaults:
   - Build command: `astro build` (or `npm run build`)
   - Output directory: `dist`
   - Install command: `npm install`
4. Deploy. Subsequent pushes to the default branch redeploy automatically.

Alternatively, from the Vercel CLI:

```sh
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production deploy
```

No serverless adapter is needed because the output is fully static. If you later
add server-rendered routes, install `@astrojs/vercel` and set it as the adapter.

## Updating the canonical URL

`astro.config.mjs` sets `site` to a placeholder Vercel URL. Once you know the
production domain, update `site` there so canonical links and the sitemap are
correct.
