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
- Resolved from prior UNKNOWN/UNLICENSED: **89 / 89**
- Remaining UNKNOWN/UNLICENSED: **0**

## Remaining Problematic Entries

- None.

## Artifacts
- `COMPLIANCE/DEPENDENCIES.csv`
- `COMPLIANCE/LICENSE_RESOLUTION.md`
- `COMPLIANCE/_generated/license_resolution.json`
