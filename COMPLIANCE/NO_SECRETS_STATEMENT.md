# No Secrets Statement

## Policy
This repository must not contain committed secrets (API keys, tokens, private keys, passwords, certificates, credentials).

## Baseline Controls
- `.gitignore` excludes `.env*` (except `.env.example`) and key/certificate patterns.
- Contributors must use secret managers/environment variables outside source control.

## Validation Guidance
Run local checks before commit:
- Search for likely secrets in tracked files
- Verify no `.env` or private key files are staged

Example checks:
- `git ls-files | rg -n "\.env|id_rsa|\.pem|token|secret|password"`
- `git status --short`

If accidental secret exposure occurs, rotate credentials immediately and remediate Git history with a formal incident process.
