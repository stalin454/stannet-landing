# ADR-013: Separate identity, public profile and professional capability data
Status: Accepted

Identity/security data remains in `users`. General public presentation remains in `profiles`. Professional-only fields live in `professional_profiles`, and offered service categories use a normalized join table.

This avoids a wide nullable user table, keeps privacy boundaries explicit and lets professional verification evolve without coupling it to login.

Exact addresses, legal documents and private contact details are not public-profile fields. Discovery uses coarse location only.
