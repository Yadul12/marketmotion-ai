# Security Specification — MarketMotion AI

## 1. Data Invariants

1. **Authentication & Verification Invariant**: Every read and write operation requires an authenticated user (`request.auth != null`) with a verified email (`request.auth.token.email_verified == true`).
2. **Ownership Invariant (`Project`)**: A `Project` document at `/projects/{projectId}` can only be created, read, updated, or deleted by the user whose `request.auth.uid == ownerId`. `ownerId` and `createdAt` are strictly immutable after creation.
3. **Master Gate Invariant (`Scene`)**: A `Scene` document at `/projects/{projectId}/scenes/{sceneId}` cannot exist without a valid parent `/projects/{projectId}` document whose `ownerId == request.auth.uid`. Furthermore, `incoming().projectId == projectId` and `incoming().ownerId == request.auth.uid`.
4. **Strict Key & Size Boundary Invariant**: All documents must contain exact required keys (`hasAll` and `hasOnly`) with every string and numeric field strictly bounded by the exact `minLength`/`maxLength` and `pattern` constraints in `firebase-blueprint.json`.
5. **Temporal Integrity Invariant**: `createdAt` on creation and `updatedAt` on both creation and update must strictly equal `request.time`.
6. **Terminal State Locking Invariant**: Once a `Project` reaches `status == 'archived'`, no subsequent updates are permitted.

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Identity Spoofing on Project Create)**: Authenticated user `user_A` attempts to create `/projects/proj_1` with `ownerId: "user_B"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Write)**: Authenticated user with `email_verified: false` attempts to create `/projects/proj_1`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection on Create)**: User sends valid `Project` payload plus an undeclared field `"isAdmin": true`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow Field Injection on Update)**: User attempts to update `/projects/proj_1` including `"hacked": "yes"` in the diff. -> `PERMISSION_DENIED`
5. **Payload 5 (Owner Hijack on Update)**: Owner `user_A` attempts to update `ownerId` to `"user_B"` on `/projects/proj_1`. -> `PERMISSION_DENIED`
6. **Payload 6 (Immortal Field Mutation)**: Owner `user_A` attempts to modify `createdAt` during an update on `/projects/proj_1`. -> `PERMISSION_DENIED`
7. **Payload 7 (Forged Client Timestamp)**: User supplies a past or future timestamp instead of `request.time` for `updatedAt`. -> `PERMISSION_DENIED`
8. **Payload 8 (Denial-of-Wallet String Overflow)**: User attempts to set `title` to a 500-character string (exceeding `maxLength: 200`). -> `PERMISSION_DENIED`
9. **Payload 9 (Invalid Status Enum / Terminal State Bypass)**: User attempts to update a project whose existing `status` is `'archived'`. -> `PERMISSION_DENIED`
10. **Payload 10 (Orphaned Subcollection Scene Create)**: User attempts to create `/projects/non_existent_proj/scenes/scene_1` where parent project does not exist. -> `PERMISSION_DENIED`
11. **Payload 11 (Cross-Tenant Subcollection Write)**: `user_B` attempts to create or update a scene inside `user_A`'s project `/projects/proj_A/scenes/scene_1`. -> `PERMISSION_DENIED`
12. **Payload 12 (Unauthorized List Query Scraping)**: `user_B` attempts an unfiltered `list` query across `/projects` without `where('ownerId', '==', 'user_B')`. -> `PERMISSION_DENIED`
