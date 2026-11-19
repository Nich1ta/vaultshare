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