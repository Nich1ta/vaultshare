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