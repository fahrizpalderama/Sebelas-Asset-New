# Security Specification - Database Aset PRO

## Data Invariants
1. A user profile MUST be created upon registration and MUST include a valid role.
2. Only Admins can register or update inventory assets.
3. Any authenticated user can report an emergency.
4. Only Technicians or Admins can resolve an emergency report.
5. Critical identifiers (uid, asset code) must be immutable after creation.

## The "Dirty Dozen" Payloads (Denial Expected)
1. **Unathenticated Read**: Anonymous attempt to read `/assets`.
2. **Identity Spoofing**: User A trying to create a profile for User B (`userId` mismatch).
3. **Privilege Escalation**: User A (Report role) trying to update their own role to 'Admin'.
4. **Invalid Role Injection**: Creating a user with role 'SuperUser'.
5. **Asset Poisoning**: Non-admin user trying to create an asset.
6. **Shadow Field Injection**: Adding `isVerified: true` to a user profile.
7. **Malicious ID**: Using a 1MB string as a `reportId`.
8. **Size Attack**: Sending a 10MB Base64 string in the `photo` field.
9. **Terminal State Bypass**: Trying to change a 'resolved' report back to 'pending'.
10. **Auth Leak**: User A trying to read User B's PII (private profile).
11. **Sync Violation**: Resolving a report without providing `solverInfo`.
12. **Id Mismatch**: Creating a report with a `reporter` name that doesn't match the auth token.

## Test Runner (Logic Verification)
```typescript
// firestore.rules.test.ts (Pseudo-code for logic verification)
// 1. Unauth read assets -> expect DENY
// 2. Auth user creates own profile -> expect ALLOW
// 3. Auth user creates profile for others -> expect DENY
// 4. Report user creates asset -> expect DENY
// 5. Admin user creates asset -> expect ALLOW
// 6. Technician resolves report with solverInfo -> expect ALLOW
// ...
```
