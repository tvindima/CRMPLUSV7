# ADR 0001: Architecture Baseline and Compliance Documentation

- Status: Accepted
- Date: 2026-02-12

## Context
The project requires auditable IP/compliance evidence without changing business logic.
A minimal architecture baseline is needed for due diligence.

## Decision
Adopt a C4-lite textual baseline and maintain an ADR trail in `ARCHITECTURE/ADR/`.

## Rationale
- Keeps architecture intent explicit for legal/commercial review.
- Reduces ambiguity about system boundaries and ownership.
- Supports future security and multi-tenant control audits.

## Consequences
- Positive: clearer traceability for technical and legal stakeholders.
- Trade-off: baseline remains high-level; deeper component ADRs may still be required.

## Follow-up ADRs
- Tenant isolation model and enforcement points
- Data retention and deletion policy
- Dependency/license governance in CI
