# ASTRA source

This directory contains the ASTRA application source, tests, and Bun lockfile. The repository-root `README.md` documents the prebuilt standalone edition.

## Requirements

- [Bun](https://bun.sh/)
- Node.js 20.19 or newer (required by the Vite 8 toolchain)

## Development

```sh
bun install --frozen-lockfile
bun run dev
```

## Checks

```sh
bun run test
```

For the standalone-configured build, set `ASTRA_STANDALONE=1` before running `bun run build` (in PowerShell: `$env:ASTRA_STANDALONE = "1"; bun run build`).

The standalone build prerenders the configured routes. GitHub Actions runs tests and the standalone build on pushes and pull requests. `bun run lint` is available but currently reports existing lint violations. The app can also use online AI services; keep provider credentials in local environment configuration and never commit secrets.
