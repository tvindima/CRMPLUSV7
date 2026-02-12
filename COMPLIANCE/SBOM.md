# SBOM and Dependency License Inventory

## Method
- Base inventory from workspace dependency manifests and lockfiles.
- License resolution from npm registry queries and local LICENSE-file fallback.
- Supplementary resolution for Python packages via PyPI metadata.

## Coverage
- Total dependencies inventoried: **216**
- By ecosystem: npm=192, pypi=24
- By workspace: backend=24, backoffice=53, site-montra=51, super-admin=56, web=32

## Resolution Outcome
- Resolved from prior UNKNOWN/UNLICENSED: **85 / 89**
- Remaining UNKNOWN/UNLICENSED: **4**
- Remaining by workspace: backoffice=2, web=2

## Remaining Problematic Entries

- `npm/backoffice` `busboy` `1.6.0` -> `UNKNOWN`
- `npm/backoffice` `streamsearch` `1.1.0` -> `UNKNOWN`
- `npm/web` `busboy` `1.6.0` -> `UNKNOWN`
- `npm/web` `streamsearch` `1.1.0` -> `UNKNOWN`

## Artifacts
- `COMPLIANCE/DEPENDENCIES.csv`
- `COMPLIANCE/LICENSE_RESOLUTION.md`
- `COMPLIANCE/_generated/license_resolution.json`
