# VaultShare

**End-to-end encrypted file storage with group sharing.**

VaultShare is a web application for storing personal files and sharing them within groups of users (study groups, roommates, work teams, families). Files are encrypted in the browser before upload: the server only stores encrypted data, unreadable even to whoever runs the system.

> 🚧 **Work in progress.** Developed for the *Internet Technologies* course, University of Parma, academic year 2026/2027.

---

## Planned features

### Personal vault
- Drag & drop upload with progress bar
- Folders, tags and favorites
- In-browser preview of PDFs and images
- Search by name, tag and date
- Optional expiry dates on documents, with reminders

### Groups
- Group creation and invite links
- Roles: owner, admin, member, read-only
- Shared folders and real-time group activity

### External sharing
- Time-limited links to a single file, for people without an account

---

## Security at a glance

All cryptographic operations run in the browser through the **Web Crypto API**, using standard implementations (no algorithm is implemented from scratch).

| Mechanism | Used for |
|---|---|
| **AES-256-GCM** | Encrypting each file with its own random key |
| **PBKDF2** | Deriving the personal key from the password, separate from the login credential |
| **RSA-OAEP / ECDH** | Sharing keys with other group members |
| **SHA-256** | File integrity checks |
| **HMAC** | Session tokens and signed invite links |

Other measures: permissions checked server-side on every request, group key rotation when a member leaves, login rate limiting, activity log.

---

## Architecture

```
Browser (React + TypeScript)
  └─ Web Crypto API: encrypts and decrypts files and keys
          │  REST / JSON (encrypted data only)
API Gateway (Node.js + Express)
  ├── Auth service          → login, JWT, roles, public keys
  ├── Vault service         → folders, groups, permissions, sharing
  ├── Storage service       → stores and serves encrypted files
  └── Notification service  → expiry dates, invites, activity
Database + file storage (encrypted data only)
```

## Tech stack

- **Frontend:** React, TypeScript, HTML, CSS
- **Backend:** Node.js, Express, REST APIs, microservices
- **Security:** Web Crypto API, JWT
- **Database:** MySQL

## Repository structure

```
vaultshare/
├── frontend/   # web app (mockups first, then React)
├── backend/    # Node.js APIs and microservices
└── docs/       # design: data model, APIs, architecture
```

---

## Roadmap

- [x] Idea and initial design
- [x] HTML and CSS interface mockups
- [x] Data model and REST API design
- [ ] Encryption prototype with the Web Crypto API
- [ ] Backend: authentication, upload, folders
- [ ] End-to-end file encryption
- [ ] React frontend
- [ ] Groups, invites and group keys
- [ ] Extensions: key rotation, time-limited links, dashboard

## Related projects

- **Nextcloud**: full self-hosted suite; end-to-end encryption is optional and limited to specific folders.
- **Proton Drive** and **Tresorit**: end-to-end encrypted cloud storage.

VaultShare follows the security model of the latter in a smaller project focused on group sharing.
