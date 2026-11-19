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
