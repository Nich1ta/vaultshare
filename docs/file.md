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