# SBOM and Dependency License Inventory

## Method
- Node.js packages: extracted from lockfiles/package metadata in each app workspace.
- Python packages: extracted from `backend/requirements.txt` (declared dependencies).
- Output artifact: `COMPLIANCE/DEPENDENCIES.csv`

## Coverage
- Total dependencies inventoried: **216**
- By ecosystem: npm=192, pypi=24
- By workspace: backend=24, backoffice=53, site-montra=51, super-admin=56, web=32

## License Risk Findings
- Dependencies with `UNKNOWN`/`UNLICENSED`: **89**
- By workspace: backend=10, backoffice=10, site-montra=29, super-admin=30, web=10

### Problematic Entries (sample)
- `npm/backoffice` `@next/swc-darwin-x64` `14.2.4` -> `UNKNOWN`
- `npm/backoffice` `@next/swc-linux-arm64-gnu` `14.2.4` -> `UNKNOWN`
- `npm/backoffice` `@next/swc-linux-arm64-musl` `14.2.4` -> `UNKNOWN`
- `npm/backoffice` `@next/swc-linux-x64-gnu` `14.2.4` -> `UNKNOWN`
- `npm/backoffice` `@next/swc-linux-x64-musl` `14.2.4` -> `UNKNOWN`
- `npm/backoffice` `@next/swc-win32-arm64-msvc` `14.2.4` -> `UNKNOWN`
- `npm/backoffice` `@next/swc-win32-ia32-msvc` `14.2.4` -> `UNKNOWN`
- `npm/backoffice` `@next/swc-win32-x64-msvc` `14.2.4` -> `UNKNOWN`
- `npm/backoffice` `busboy` `1.6.0` -> `UNKNOWN`
- `npm/backoffice` `streamsearch` `1.1.0` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-darwin-x64` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-libvips-darwin-x64` `1.2.4` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-libvips-linux-arm` `1.2.4` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-libvips-linux-arm64` `1.2.4` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-libvips-linux-ppc64` `1.2.4` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-libvips-linux-riscv64` `1.2.4` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-libvips-linux-s390x` `1.2.4` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-libvips-linux-x64` `1.2.4` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-libvips-linuxmusl-arm64` `1.2.4` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-libvips-linuxmusl-x64` `1.2.4` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-linux-arm` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-linux-arm64` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-linux-ppc64` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-linux-riscv64` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-linux-s390x` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-linux-x64` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-linuxmusl-arm64` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-linuxmusl-x64` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-wasm32` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-win32-arm64` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-win32-ia32` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@img/sharp-win32-x64` `0.34.5` -> `UNKNOWN`
- `npm/site-montra` `@next/swc-darwin-x64` `16.0.10` -> `UNKNOWN`
- `npm/site-montra` `@next/swc-linux-arm64-gnu` `16.0.10` -> `UNKNOWN`
- `npm/site-montra` `@next/swc-linux-arm64-musl` `16.0.10` -> `UNKNOWN`
- `npm/site-montra` `@next/swc-linux-x64-gnu` `16.0.10` -> `UNKNOWN`
- `npm/site-montra` `@next/swc-linux-x64-musl` `16.0.10` -> `UNKNOWN`
- `npm/site-montra` `@next/swc-win32-arm64-msvc` `16.0.10` -> `UNKNOWN`
- `npm/site-montra` `@next/swc-win32-x64-msvc` `16.0.10` -> `UNKNOWN`
- `npm/super-admin` `@emnapi/runtime` `1.8.1` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-darwin-x64` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-libvips-darwin-x64` `1.2.4` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-libvips-linux-arm` `1.2.4` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-libvips-linux-arm64` `1.2.4` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-libvips-linux-ppc64` `1.2.4` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-libvips-linux-riscv64` `1.2.4` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-libvips-linux-s390x` `1.2.4` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-libvips-linux-x64` `1.2.4` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-libvips-linuxmusl-arm64` `1.2.4` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-libvips-linuxmusl-x64` `1.2.4` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-linux-arm` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-linux-arm64` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-linux-ppc64` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-linux-riscv64` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-linux-s390x` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-linux-x64` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-linuxmusl-arm64` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-linuxmusl-x64` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-wasm32` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-win32-arm64` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-win32-ia32` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@img/sharp-win32-x64` `0.34.5` -> `UNKNOWN`
- `npm/super-admin` `@next/swc-darwin-x64` `16.1.1` -> `UNKNOWN`
- `npm/super-admin` `@next/swc-linux-arm64-gnu` `16.1.1` -> `UNKNOWN`
- `npm/super-admin` `@next/swc-linux-arm64-musl` `16.1.1` -> `UNKNOWN`
- `npm/super-admin` `@next/swc-linux-x64-gnu` `16.1.1` -> `UNKNOWN`
- `npm/super-admin` `@next/swc-linux-x64-musl` `16.1.1` -> `UNKNOWN`
- `npm/super-admin` `@next/swc-win32-arm64-msvc` `16.1.1` -> `UNKNOWN`
- `npm/super-admin` `@next/swc-win32-x64-msvc` `16.1.1` -> `UNKNOWN`
- `npm/web` `@next/swc-darwin-x64` `14.2.4` -> `UNKNOWN`
- `npm/web` `@next/swc-linux-arm64-gnu` `14.2.4` -> `UNKNOWN`
- `npm/web` `@next/swc-linux-arm64-musl` `14.2.4` -> `UNKNOWN`
- `npm/web` `@next/swc-linux-x64-gnu` `14.2.4` -> `UNKNOWN`
- `npm/web` `@next/swc-linux-x64-musl` `14.2.4` -> `UNKNOWN`
- `npm/web` `@next/swc-win32-arm64-msvc` `14.2.4` -> `UNKNOWN`
- `npm/web` `@next/swc-win32-ia32-msvc` `14.2.4` -> `UNKNOWN`
- `npm/web` `@next/swc-win32-x64-msvc` `14.2.4` -> `UNKNOWN`
- `npm/web` `busboy` `1.6.0` -> `UNKNOWN`
- `npm/web` `streamsearch` `1.1.0` -> `UNKNOWN`
- `pypi/backend` `alembic` `>=1.13.0` -> `UNKNOWN`
- ... and 9 more (see `COMPLIANCE/_generated/license_problems.json`)

## Interpretation
Many `UNKNOWN` entries are platform-specific binary helper packages (e.g. `@next/swc-*`, `@img/sharp-*`) that often omit SPDX in `package.json`.
This is a compliance risk until evidence is attached in notice records.

## Recommended Remediation
1. For each `UNKNOWN` npm package, capture upstream LICENSE URL or local LICENSE file evidence and pin package version.
2. For Python dependencies, replace unpinned requirements with pinned versions and capture license from package metadata for each resolved version.
3. Enforce CI check that blocks new `UNKNOWN/UNLICENSED` entries unless waiver is documented.
