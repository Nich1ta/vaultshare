# REST API

## Conventions

- Base URL: `http://localhost:5678/api`
- Requests and responses use JSON, except file upload and download.
- After login, every request must include the token in the header:
  `Authorization: Bearer <token>`
- Ids follow the data model (`u_...`, `fo_...`, `fi_...`, `g_...`).

### Status codes

| Code                    | Meaning                                                                          |
| ----------------------- | -------------------------------------------------------------------------------- |
| `200 OK`                | Request succeeded                                                                |
| `201 Created`           | A new resource was created                                                       |
| `204 No Content`        | Succeeded, nothing to return (e.g. after a delete)                               |
| `400 Bad Request`       | Missing or invalid data                                                          |
| `401 Unauthorized`      | Missing or invalid token                                                         |
| `403 Forbidden`         | Logged in, but not allowed (e.g. a read-only member uploading)                   |
| `404 Not Found`         | The resource doesn't exist                                                       |
| `409 Conflict`          | The resource already exists (e.g. email already registered)                      |
| `410 Gone`              | The resource existed but is no longer available (e.g. an expired or used invite) |
| `429 Too Many Requests` | Too many login attempts                                                          |

## Endpoints

### Auth and users

| Method | URL                     | Description                                  | Req. |
| ------ | ----------------------- | -------------------------------------------- | ---- |
| POST   | `/auth/register`        | Create an account                            | FR1  |
| POST   | `/auth/login`           | Log in, returns a token                      | FR2  |
| GET    | `/auth/me`              | Current user's profile and storage usage     | FR10 |
| GET    | `/users/:id/public-key` | A user's public key, to share keys with them | FR12 |

### Folders

| Method | URL                  | Description                             | Req. |
| ------ | -------------------- | --------------------------------------- | ---- |
| GET    | `/folders?parentId=` | List folders (top level if no parentId) | FR6  |
| POST   | `/folders`           | Create a folder                         | FR6  |
| PATCH  | `/folders/:id`       | Rename a folder                         | FR6  |
| DELETE | `/folders/:id`       | Delete a folder                         | FR8  |

### Files

| Method | URL                              | Description                         | Req.          |
| ------ | -------------------------------- | ----------------------------------- | ------------- |
| GET    | `/files?folderId=&groupId=&tag=` | List files, with optional filters   | FR7           |
| POST   | `/files`                         | Upload an encrypted file            | FR4           |
| GET    | `/files/:id`                     | File metadata                       | FR5           |
| GET    | `/files/:id/content`             | Download the encrypted file         | FR5           |
| PATCH  | `/files/:id`                     | Move, rename, change tags or expiry | FR6, FR7, FR9 |
| DELETE | `/files/:id`                     | Delete a file                       | FR8           |
| POST   | `/files/:id/links`               | Create a time-limited share link    | FR16          |
| GET    | `/links/:token`                  | Open a share link (no login needed) | FR16          |

### Groups

| Method | URL                           | Description                                              | Req.       |
| ------ | ----------------------------- | -------------------------------------------------------- | ---------- |
| GET    | `/groups`                     | List the user's groups                                   | FR11       |
| POST   | `/groups`                     | Create a group                                           | FR11       |
| GET    | `/groups/:id`                 | Group details and members                                | FR11       |
| DELETE | `/groups/:id`                 | Delete a group (owner only)                              | FR11       |
| POST   | `/groups/:id/invites`         | Create an invite link                                    | FR12       |
| POST   | `/invites/:id/accept`         | Accept an invite and join the group                      | FR12       |
| PATCH  | `/groups/:id/members/:userId` | Change a member's role or send them the group key        | FR12, FR13 |
| DELETE | `/groups/:id/members/:userId` | Remove a member                                          | FR13       |
| PUT    | `/groups/:id/keys`            | Upload the new group key for every member (key rotation) | NFR7       |
| GET    | `/groups/:id/activity`        | Group activity                                           | FR15       |

## Details

### POST /auth/register

Request:

```json
{
  "name": "Nichita",
  "email": "nichita@example.com",
  "loginKey": "derived-in-the-browser...",
  "publicKey": "MIIBIjANBgkq...",
  "encryptedPrivateKey": "U2FsdGVkX1...",
  "keySalt": "q8Zt3Lp0..."
}
```

Response `201 Created`:

```json
{
  "id": "u_8f3a2c",
  "name": "Nichita",
  "email": "nichita@example.com",
  "createdAt": "2026-11-26T13:15:00Z"
}
```

Errors: `400` if a field is missing, `409` if the email is already registered.

`loginKey` is not the password: the browser derives it from the password with PBKDF2,
so the real password never leaves the device. The server stores only a hash of `loginKey`.

### POST /auth/login

Request:

```json
{
  "email": "nichita@example.com",
  "loginKey": "derived-in-the-browser..."
}
```

Response `200 OK`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "u_8f3a2c",
    "name": "Nichita",
    "email": "nichita@example.com"
  },
  "keySalt": "q8Zt3Lp0...",
  "publicKey": "MIIBIjANBgkq...",
  "encryptedPrivateKey": "U2FsdGVkX1..."
}
```

Errors: `400` if a field is missing, `401` if email or loginKey is wrong,
`429` after too many failed attempts.

The browser derives `loginKey` from the password, using a salt computed from the email,
so it can log in without asking the server for anything first. After login, it uses
`keySalt` to derive the personal key and decrypt `encryptedPrivateKey`.
The `401` message is the same whether the email exists or not, so an attacker
can't use the login form to find out which emails are registered.

### GET /files

Query parameters (all optional):

- `folderId`: only files in this folder
- `groupId`: only files in this group
- `tag`: only files with this tag

Response `200 OK`: an array of File objects, as described in `data-model.md`.

Errors: `401` no token, `404` if the folder or group belongs to someone else.

File names are encrypted, so the server can't search by name: the browser decrypts
the names and filters them locally.

### POST /files

Request: `multipart/form-data` with

- `file`: the encrypted file
- `metadata`: JSON with `encryptedName`, `folderId`, `groupId`, `mimeType`, `iv`, `encryptedKey`, `sha256`, `tags`, `expiresAt`

Response `201 Created`: the File object as described in `data-model.md`.

Errors: `400` invalid metadata, `401` no token, `403` read-only member or storage limit exceeded.

### GET /files/:id/content

Response `200 OK`: the encrypted file as raw bytes (`Content-Type: application/octet-stream`).

Errors: `401` no token, `404` no access to the file, `404` file not found.

After the download, the browser:

1. computes the SHA-256 of the received bytes and compares it with `sha256` from the metadata;
2. if they don't match, it rejects the file, because it was altered on the server;
3. otherwise it decrypts `encryptedKey`, then decrypts the file with AES-GCM using `iv`.

### POST /groups/:id/invites

Request:

```json
{
  "email": "gaia@example.com",
  "role": "member"
}
```

Response `201 Created`:

```json
{
  "id": "inv_7d20a9",
  "link": "http://localhost:5173/invite/inv_7d20a9?sig=a3f9c1e7b2...",
  "expiresAt": "2026-12-03T13:15:00Z"
}
```

Errors: `400` invalid role (nobody can be invited as `"owner"`), `401` no token,
`403` if the user is not the group's owner or an admin.

The link contains the invite's HMAC signature (`sig`), computed by the server.
Invites expire after 7 days.

### POST /invites/:id/accept

Request:

```json
{
  "signature": "a3f9c1e7b2..."
}
```

Response `200 OK`:

```json
{
  "groupId": "g_51d0e7",
  "role": "member",
  "status": "pending_key"
}
```

Errors: `400` invalid signature, `401` no token, `410` invite expired or already used.

The server can't give the new member the group key, because it can't read it.
The member joins with status `pending_key`. The next time an owner or admin opens
the group, their browser encrypts the group key with the new member's public key
and sends it with `PATCH /groups/:id/members/:userId`. From then on, the member
can read the group's files.
