CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_users_email ON users (LOWER(email));

INSERT INTO users (name, email, password_hash, role, is_active)
VALUES
    ('Admin User', 'admin@example.com', crypt('password123', gen_salt('bf', 10)), 'ADMIN', TRUE),
    ('Employee User', 'employee@example.com', crypt('password123', gen_salt('bf', 10)), 'EMPLOYEE', TRUE),
    ('Manager User', 'manager@example.com', crypt('password123', gen_salt('bf', 10)), 'MANAGER', TRUE),
    ('Finance User', 'finance@example.com', crypt('password123', gen_salt('bf', 10)), 'FINANCE', TRUE);
