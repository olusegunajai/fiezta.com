# Security Specification - Fiezta

## Data Invariants
1. A **User** must belong to an **Agency** (`agencyId`).
2. **Bookings**, **Packages**, **Accommodations**, and **Transport** docs must have a valid `agencyId` matching the creator's agency.
3. Access to sub-resources (like **Tasks** or **Invoices**) is strictly gated by the parent's `agencyId` and the user's `role`.
4. **Roles** define the tiered access:
   - `super_admin`: Full access to everything.
   - `admin`: Full access within their agency.
   - `agent`/`accountant`/`support`: Specific write access to their domain entities.
   - `client`: Read-only access to their own data (bookings, invoices, etc.).
5. **PII Isolation**: Users can only read their own private profiles unless they are agency staff.

## The "Dirty Dozen" Payloads (Denial Expected)

1. **Identity Spoofing**: Creating a booking with a different `clientId`.
2. **Agency Leak**: Accessing or creating data with a different `agencyId`.
3. **Ghost Fields**: Adding `isVerified: true` to a User profile.
4. **Privilege Escalation**: Updating own `role` to `admin`.
5. **ID Poisoning**: Creating a document with a 2KB string as ID.
6. **Immutable Tampering**: Changing `createdAt` or `agencyId` on an existing booking.
7. **Type Mismatch**: Sending a string for `price` (number).
8. **Resource Exhaustion**: Sending a 1MB string in a `description` field.
9. **Terminal State Bypass**: Changing a `completed` booking status back to `pending`.
10. **Shadow Logic**: Updating internal fields like `loyaltyPoints` from client side.
11. **Orphaned Write**: Creating a Task for a non-existent Agency.
12. **PII Leak**: Querying all User profiles without filtering by `agencyId`.

## Verification Policy
All write operations must be validated by `isValid[Entity]` helpers.
All updates must be gated by `affectedKeys().hasOnly()` for specific actions.
All query strings and IDs must match `isValidId()` regex.
