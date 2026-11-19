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