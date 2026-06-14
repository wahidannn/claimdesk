CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    manager_id BIGINT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX ux_departments_name ON departments (LOWER(name));

CREATE TABLE expense_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX ux_expense_categories_name ON expense_categories (LOWER(name));

ALTER TABLE users
    ADD COLUMN department_id BIGINT NULL,
    ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id);

INSERT INTO departments (name, is_active)
VALUES
    ('Operations', TRUE),
    ('Finance', TRUE),
    ('Administration', TRUE);

UPDATE departments
SET manager_id = (SELECT id FROM users WHERE email = 'manager@example.com')
WHERE name = 'Operations';

UPDATE users
SET department_id = (SELECT id FROM departments WHERE name = 'Administration')
WHERE email = 'admin@example.com';

UPDATE users
SET department_id = (SELECT id FROM departments WHERE name = 'Operations')
WHERE email IN ('employee@example.com', 'manager@example.com');

UPDATE users
SET department_id = (SELECT id FROM departments WHERE name = 'Finance')
WHERE email = 'finance@example.com';

INSERT INTO expense_categories (name, description, is_active)
VALUES
    ('Travel', 'Transport and travel expenses', TRUE),
    ('Meals', 'Meals and entertainment expenses', TRUE),
    ('Office Supplies', 'Office equipment and supplies', TRUE);
