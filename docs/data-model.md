# Data model

This document describes the main resources of VaultShare and their fields.
All dates use ISO 8601 format (UTC). Sizes are in bytes.

## User

```json
{
  "id": "u_8f3a2c",
  "name": "Nichita",
  "email": "nichita@example.com",
  "passwordHash": "$2b$12$Kix...",
  "publicKey": "MIIBIjANBgkq...",
  "encryptedPrivateKey": "U2FsdGVkX1...",
  "keySalt": "q8Zt3Lp0...",
  "storageUsed": 1288490188,
  "storageLimit": 10737418240,
  "createdAt": "2026-11-02T10:15:00Z"
}
```

| Field | Description |
|---|---|
| `passwordHash` | Hash of the login credential, never the password itself |
| `publicKey` | Used by others to share files and group keys with this user |
| `encryptedPrivateKey` | The private key, encrypted in the browser with the user's personal key. The server can't read it |
| `keySalt` | Salt used with PBKDF2 to derive the personal key from the password |


## Folder

```json
{
  "id": "fo_2b91e4",
  "encryptedName": "Xk2pQ9vL...",
  "ownerId": "u_8f3a2c",
  "groupId": null,
  "createdAt": "2026-11-02T10:15:00Z"
}
```

`groupId` is `null` for folders in the personal vault, or the group's id for shared folders.

## File

```json
{
  "id": "fi_3j72d2",
  "encryptedName": "pL7wQ2nR...",
  "folderId": "fo_2b91e4",
  "ownerId": "u_8f3a2c",
  "groupId": null,
  "size": 3145728,
  "mimeType": "application/pdf",
  "iv": "9fK2mQ7xR1sL",
  "encryptedKey": "Zt8vN3qP...",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "tags": ["study", "exam"],
  "expiresAt": null,
  "uploadedBy": "u_8f3a2c",
  "createdAt": "2026-11-17T14:32:00Z"
}
```

| Field | Description |
|---|---|
| `size` | Size of the encrypted file in bytes |
| `iv` | Random value used by AES-GCM, different for every file |
| `encryptedKey` | The file's AES key, encrypted with the owner's personal key (or the group key) |
| `sha256` | Hash of the encrypted file, used to verify its integrity on download |
| `expiresAt` | Expiry date for reminders, or `null` if the document doesn't expire |

## Group

```json
{
  "id": "g_51d0e7",
  "encryptedName": "Hq4vT8mW...",
  "ownerId": "u_8f3a2c",
  "keyVersion": 2,
  "members": [
    {
      "userId": "u_8f3a2c",
      "role": "owner",
      "encryptedGroupKey": "Rk9vX2pL...",
      "joinedAt": "2026-11-02T10:15:00Z"
    },
    {
      "userId": "u_4c7e91",
      "role": "admin",
      "encryptedGroupKey": "Mz3tB8qN...",
      "joinedAt": "2026-11-03T09:40:00Z"
    }
  ],
  "createdAt": "2026-11-02T10:15:00Z"
}
```

| Field | Description |
|---|---|
| `members` | One entry per member of the group |
| `role` | One of `"owner"`, `"admin"`, `"member"`, `"read-only"` |
| `encryptedGroupKey` | The group's AES key, encrypted with **this member's** public key. Each member has a different value, and only they can decrypt it |
| `keyVersion` | Increases every time the group key is rotated (for example when a member is removed) |

## Invite

```json
{
  "id": "inv_7d20a9",
  "groupId": "g_51d0e7",
  "invitedBy": "u_8f3a2c",
  "email": "gaia@example.com",
  "role": "member",
  "expiresAt": "2026-11-09T10:15:00Z",
  "usedAt": null,
  "signature": "a3f9c1e7b2..."
}
```

| Field | Description |
|---|---|
| `role` | Role the new member will receive when joining |
| `expiresAt` | After this date the invite link no longer works |
| `usedAt` | When the invite was accepted, or `null` if still pending. An invite can be used only once |
| `signature` | HMAC of the invite data, computed by the server. A forged or modified invite link fails verification |

## Activity

```json
{
  "id": "act_c41b88",
  "groupId": "g_51d0e7",
  "actorId": "u_8f3a2c",
  "action": "member_removed",
  "details": {
    "targetUserId": "u_9e2f10",
    "newKeyVersion": 2
  },
  "createdAt": "2026-11-12T16:05:00Z"
}
```

| Field | Description |
|---|---|
| `actorId` | The user who performed the action |
| `action` | One of `"group_created"`, `"member_joined"`, `"member_removed"`, `"role_changed"`, `"file_uploaded"`, `"file_deleted"`, `"key_rotated"` |
| `details` | Extra data that depends on the action (for example which file or which member) |