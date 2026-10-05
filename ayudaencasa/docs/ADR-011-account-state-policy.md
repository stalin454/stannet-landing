# ADR-011: Authenticated is not authorized
Status: Accepted

A pending identity may hold a session so the UI can complete verification and account recovery. Every marketplace mutation requires an authenticated **and active** principal plus same-origin/CSRF validation.

The API guard owns the common session/account-state policy. Domain/application use cases still own object- and role-level authorization.

Password reset accepts a plaintext candidate only at the trusted server boundary and hashes it through the injected password adapter. Browser-provided password hashes are never accepted as credentials.
