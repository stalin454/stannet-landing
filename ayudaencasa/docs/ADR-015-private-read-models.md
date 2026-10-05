# ADR-015: Private read models
Status: Accepted

Authenticated dashboards, proposal lists and conversations use dedicated bounded read models.

Authorization happens before private collection retrieval. Unauthorized object access returns the same not-found shape as a missing object to reduce ID probing.

Collections are paginated in SQL. DTOs expose only fields required by the authenticated screen. Public discovery queries are never reused as a substitute for private authorization.

No CQRS framework or second datastore is introduced: these are explicit read queries over D1.
