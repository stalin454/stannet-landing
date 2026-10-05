# ADR-003: Explicit marketplace state machine
Status: Accepted

## Decision
Requests and proposals use explicit finite states. UI actions do not write arbitrary status values. Application use cases own transitions.

Request: draft -> open -> assigned -> in_progress -> completed, with cancellation handled explicitly.
Proposal: pending -> accepted/rejected/withdrawn.

Acceptance is the boundary that creates a private conversation. Reviews require a completed request and an actual participant relationship.

## Why
This prevents impossible states, authorization bypasses and frontend-specific business rules. It also makes tests and future payment/dispute workflows predictable.
