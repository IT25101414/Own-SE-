# ADR 001: Use a modular monolith

- Status: Accepted
- Date: 2026-10-19

## Context

SupplyLens contains repository inventory, scanning, vulnerability intelligence, policy, and reporting behavior. These are distinct domain concepts, but the initial product is maintained by a small team and deployed as one portfolio application.

## Decision

Use one deployable application and one relational database while preserving bounded contexts through source modules and domain terminology.

## Consequences

### Positive

- Local development and deployment remain simple.
- Use cases can use database transactions without distributed coordination.
- Refactoring boundaries is inexpensive while the domain is still being learned.
- The system still demonstrates DDD, layering, API design, persistence, and testing.

### Negative

- A failure can affect the entire application.
- Modules can become coupled if dependency rules are ignored.
- Independent scaling is unavailable until a context is extracted.

## Revisit when

A bounded context has a different scaling profile, release cadence, security boundary, or team owner that cannot be supported cleanly inside the monolith.
