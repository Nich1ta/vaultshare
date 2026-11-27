-- VaultShare database schema

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    login_key_hash VARCHAR(255) NOT NULL,
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    key_salt VARCHAR(64) NOT NULL,
    storage_used BIGINT NOT NULL DEFAULT 0,
    storage_limit BIGINT NOT NULL DEFAULT 10737418240,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS folders (
    id VARCHAR(20) PRIMARY KEY,
    owner_id VARCHAR(20) NOT NULL,
    parent_id VARCHAR(20) NULL,
    encrypted_name TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES folders (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS files (
  id             VARCHAR(20)  PRIMARY KEY,
  owner_id       VARCHAR(20)  NOT NULL,
  folder_id      VARCHAR(20)  NULL,
  encrypted_name TEXT         NOT NULL,
  mime_type      VARCHAR(100) NOT NULL,
  size           BIGINT       NOT NULL,
  iv             VARCHAR(64)  NOT NULL,
  encrypted_key  TEXT         NOT NULL,
  sha256         CHAR(64)     NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id)  REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);