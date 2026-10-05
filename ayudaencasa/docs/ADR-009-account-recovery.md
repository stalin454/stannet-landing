# ADR-009: One-time account tokens and non-enumerating recovery
Status: Accepted

Verification tokens expire after 24 hours. Password-reset tokens expire after 30 minutes. Only SHA-256 token digests are persisted; raw high-entropy tokens exist only long enough to be delivered.

Issuing a newer token invalidates prior unused tokens of the same purpose. Consumption is one-time. Successful password reset revokes all existing sessions.

Password-recovery requests return the same accepted response whether or not the address exists. Mail delivery is an adapter, not an application dependency.

Pending identities may authenticate only for account-verification UX. Marketplace mutations require active status.
