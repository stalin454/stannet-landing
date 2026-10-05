# Test strategy

AyudaEnCasa uses layered verification without introducing a large test framework prematurely.

## Fast gate
Node syntax checks and focused domain/application contract tests run on every AyudaEnCasa change.

## Database gate
CI creates an isolated local D1 and applies the complete append-only migration chain. This catches invalid SQL, ordering errors and schema drift before deployment.

## Integration gate
The next level executes lifecycle scenarios against local D1: identity, request, proposal, atomic acceptance, conversation, completion and reviews, including conflict cases.

## E2E gate
Before public launch, browser-level tests cover registration -> verification -> profile -> request -> proposal -> acceptance -> chat -> completion -> review.

## Rule
A feature is **code complete** when implementation and focused tests exist. It is **verified** only after the corresponding CI/integration gate has executed successfully.
