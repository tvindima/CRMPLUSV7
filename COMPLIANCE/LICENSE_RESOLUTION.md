# License Resolution

Resolution pass date: 2026-02-12

Method:
- For each item from `COMPLIANCE/_generated/license_problems.json`, executed:
  - `npm view <package>@<version> license --json`
  - `npm view <package>@<version> repository.url --json`
- Where registry `license` was empty, validated `node_modules/<package>/LICENSE` and `npm pack` tarball contents.

| Package | Version | License | Source (npm/License file) | Notes |
|---|---|---|---|---|
| `@next/swc-darwin-x64` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-arm64-gnu` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-arm64-musl` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-x64-gnu` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-x64-musl` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-win32-arm64-msvc` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-win32-ia32-msvc` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-win32-x64-msvc` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `busboy` | `1.6.0` | `MIT` | License file | License confirmed from `backoffice/node_modules/busboy/LICENSE`; tarball evidence `COMPLIANCE/_generated/tarballs/busboy-1.6.0.tgz` path `mscdex-busboy-9aadb7a/LICENSE` (MIT text). |
| `streamsearch` | `1.1.0` | `MIT` | License file | License confirmed from `backoffice/node_modules/streamsearch/LICENSE`; tarball evidence `COMPLIANCE/_generated/tarballs/streamsearch-1.1.0.tgz` path `mscdex-streamsearch-b9e9b39/LICENSE` (MIT text). |
| `@img/sharp-darwin-x64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-darwin-x64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-arm` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-arm64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-ppc64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-riscv64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-s390x` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-x64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linuxmusl-arm64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linuxmusl-x64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-arm` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-arm64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-ppc64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-riscv64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-s390x` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-x64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linuxmusl-arm64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linuxmusl-x64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-wasm32` | `0.34.5` | `Apache-2.0 AND LGPL-3.0-or-later AND MIT` | npm registry | License Confirmed via npm registry |
| `@img/sharp-win32-arm64` | `0.34.5` | `Apache-2.0 AND LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-win32-ia32` | `0.34.5` | `Apache-2.0 AND LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-win32-x64` | `0.34.5` | `Apache-2.0 AND LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@next/swc-darwin-x64` | `16.0.10` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-arm64-gnu` | `16.0.10` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-arm64-musl` | `16.0.10` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-x64-gnu` | `16.0.10` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-x64-musl` | `16.0.10` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-win32-arm64-msvc` | `16.0.10` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-win32-x64-msvc` | `16.0.10` | `MIT` | npm registry | License Confirmed via npm registry |
| `@emnapi/runtime` | `1.8.1` | `MIT` | npm registry | License Confirmed via npm registry |
| `@img/sharp-darwin-x64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-darwin-x64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-arm` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-arm64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-ppc64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-riscv64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-s390x` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linux-x64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linuxmusl-arm64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-libvips-linuxmusl-x64` | `1.2.4` | `LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-arm` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-arm64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-ppc64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-riscv64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-s390x` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linux-x64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linuxmusl-arm64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-linuxmusl-x64` | `0.34.5` | `Apache-2.0` | npm registry | License Confirmed via npm registry |
| `@img/sharp-wasm32` | `0.34.5` | `Apache-2.0 AND LGPL-3.0-or-later AND MIT` | npm registry | License Confirmed via npm registry |
| `@img/sharp-win32-arm64` | `0.34.5` | `Apache-2.0 AND LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-win32-ia32` | `0.34.5` | `Apache-2.0 AND LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@img/sharp-win32-x64` | `0.34.5` | `Apache-2.0 AND LGPL-3.0-or-later` | npm registry | License Confirmed via npm registry |
| `@next/swc-darwin-x64` | `16.1.1` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-arm64-gnu` | `16.1.1` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-arm64-musl` | `16.1.1` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-x64-gnu` | `16.1.1` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-x64-musl` | `16.1.1` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-win32-arm64-msvc` | `16.1.1` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-win32-x64-msvc` | `16.1.1` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-darwin-x64` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-arm64-gnu` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-arm64-musl` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-x64-gnu` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-linux-x64-musl` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-win32-arm64-msvc` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-win32-ia32-msvc` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `@next/swc-win32-x64-msvc` | `14.2.4` | `MIT` | npm registry | License Confirmed via npm registry |
| `busboy` | `1.6.0` | `MIT` | License file | License confirmed from `web/node_modules/busboy/LICENSE`; tarball evidence `COMPLIANCE/_generated/tarballs/busboy-1.6.0.tgz` path `mscdex-busboy-9aadb7a/LICENSE` (MIT text). |
| `streamsearch` | `1.1.0` | `MIT` | License file | License confirmed from `web/node_modules/streamsearch/LICENSE`; tarball evidence `COMPLIANCE/_generated/tarballs/streamsearch-1.1.0.tgz` path `mscdex-streamsearch-b9e9b39/LICENSE` (MIT text). |
| `alembic` | `>=1.13.0` | `MIT` | PyPI metadata | License confirmed via PyPI license_expression |
| `fastapi` | `unspecified` | `MIT` | PyPI metadata | License confirmed via PyPI license_expression |
| `Pillow` | `>=10.0.0` | `MIT-CMU` | PyPI metadata | License confirmed via PyPI license_expression |
| `pydantic` | `[email]` | `MIT` | PyPI metadata | License confirmed via PyPI license_expression |
| `PyJWT` | `unspecified` | `MIT` | PyPI metadata | License confirmed via PyPI license_expression |
| `pymongo` | `unspecified` | `Apache-2.0` | PyPI metadata | License confirmed via PyPI license_expression |
| `pytest` | `unspecified` | `MIT` | PyPI metadata | License confirmed via PyPI license_expression |
| `python-dotenv` | `unspecified` | `BSD-3-Clause` | PyPI metadata | License confirmed via PyPI license_expression |
| `uvicorn` | `[standard]` | `BSD-3-Clause` | PyPI metadata | License confirmed via PyPI license_expression |
| `websockets` | `>=12.0` | `BSD-3-Clause` | PyPI metadata | License confirmed via PyPI license_expression |
