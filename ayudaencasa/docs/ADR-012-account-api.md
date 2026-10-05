# ADR-012: Account lifecycle API
Status: Accepted

Account verification and password recovery are separate from marketplace authorization.

- Verification resend requires a valid pending session.
- Token verification itself does not require the old session.
- Password-reset request is public, rate-limited and non-enumerating.
- Password-reset consumption is public, rate-limited, one-time and revokes all sessions.
- Account routes orchestrate protocol/application concerns; mail remains an adapter.
- HTTP 204 responses contain no body.

The frontend never stores reset/session secrets beyond what is necessary for the active interaction.
