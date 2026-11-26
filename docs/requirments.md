# Requirements

This document lists what VaultShare must do (functional requirements)
and the qualities it must have (non-functional requirements).

## Functional requirements

### Account
- FR1. The user can register with name, email and password.
- FR2. The user can log in and log out.
- FR3. After registration, the user receives a recovery key to restore access to their files if they forget the password.

### Personal vault
- FR4. The user can upload files to their personal vault.
- FR5. The user can download and preview their files (PDF and images).
- FR6. The user can create folders and move files between them.
- FR7. The user can add tags to files and search files by name, tag and date.
- FR8. The user can delete files and folders.
- FR9. The user can set an optional expiry date on a document and receive a reminder before it expires.
- FR10. The user can see how much storage they are using out of their limit.

### Groups
- FR11. The user can create a group and becomes its owner.
- FR12. An owner or admin can invite new members with an invite link.
- FR13. An owner or admin can change a member's role (owner, admin, member, read-only) and remove members.
- FR14. Members can upload and download files in the group's shared folders; read-only members can only download.
- FR15. Members can see the group's activity: uploads, new members, removals and role changes.

### Sharing
- FR16. The user can create a time-limited link to share a single file with someone who has no account.

## Non-functional requirements

### Security
- NFR1. Files are encrypted in the browser before upload; the server never receives them in plain text.
- NFR2. File names, folder names and group names are encrypted too.
- NFR3. Login passwords are stored only as salted hashes.
- NFR4. Permissions are checked on the server for every request, not only hidden in the interface.
- NFR5. Each file has a SHA-256 hash; a file that was altered on the server is rejected on download.
- NFR6. Invite links are signed, expire, and can be used only once.
- NFR7. When a member is removed from a group, the group key is rotated so they cannot read new files.
- NFR8. Repeated failed login attempts are limited (rate limiting).

### Usability
- NFR9. The interface works on desktop browsers and on small laptop screens.
- NFR10. Encryption happens automatically: the user never has to manage keys by hand.

### Other
- NFR11. Each user has a storage limit (10 GB by default).
- NFR12. Cryptography uses only standard algorithms from the Web Crypto API; no algorithm is implemented from scratch.