-- VaultShare database schema

CREATE TABLE users (
  id                    VARCHAR(20)  PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  email                 VARCHAR(255) NOT NULL UNIQUE,
  login_key_hash        VARCHAR(255) NOT NULL,
  public_key            TEXT         NOT NULL,
  encrypted_private_key TEXT         NOT NULL,
  key_salt              VARCHAR(64)  NOT NULL,
  storage_used          BIGINT       NOT NULL DEFAULT 0,
  storage_limit         BIGINT       NOT NULL DEFAULT 10737418240,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);