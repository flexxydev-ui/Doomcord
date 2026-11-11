# Doomcord Security Specification & Red Team Audit

## 1. Data Invariants
1. Identity Integrity: A user can only write to their own profile `/users/{userId}` where `request.auth.uid == userId`.
2. Message Authorship: Every message must have `senderId == request.auth.uid`. Users cannot forge other users' identity.
3. Friendship Invariants: A user can only send requests where `fromUid == request.auth.uid` and accept/reject requests where `toUid == request.auth.uid`.
4. Channel Message Invariants: Messages in community channels require authentication; members can update their own messages or add reactions and read receipts.
5. Direct Message Integrity: Only participants of a direct message thread can read or write messages within it.
6. Read Status Invariants: Users can append their own UID to the `readBy` list without overwriting the message text or other participants' read markers.
7. Orb Creation Invariants: Orbs require authenticated creator where `creatorId == request.auth.uid`.

## 2. The Dirty Dozen Payloads
1. Spoofed User Profile write: Authenticated user A attempts to update `/users/userB` -> PERMISSION_DENIED.
2. Shadow field injection on user profile: Injection of `isAdmin: true` in user update -> REJECTED.
3. Message author spoofing: User A creates a message with `senderId: "userB"` -> PERMISSION_DENIED.
4. Message tampering: User A attempts to edit content of a message created by User B -> PERMISSION_DENIED.
5. Direct Message snooping: User C attempts to list messages in a DM between User A and User B -> PERMISSION_DENIED.
6. Fake friend request: User A sends a friend request with `fromUid: "userB"` -> PERMISSION_DENIED.
7. Friend request hijack: User C accepts a friend request sent from User A to User B -> PERMISSION_DENIED.
8. Malicious payload size: Injecting a 2MB string in message `content` -> PERMISSION_DENIED (capped at 4000 chars).
9. Orb ownership stealing: User B attempts to delete an Orb created by User A -> PERMISSION_DENIED.
10. Community deletion by non-owner: Regular member attempts to delete `/communities/{id}` -> PERMISSION_DENIED.
11. Channel injection: Unauthenticated user attempts to create a channel -> PERMISSION_DENIED.
12. Read receipt corruption: User B attempts to clear other users from `readBy` array -> REJECTED.

## 3. Fortress Rule Architecture
Rules enforce ABAC, path validation, identity validation, and action-based updates.
