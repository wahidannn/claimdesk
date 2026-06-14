CREATE TABLE expense_claims (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL,
    submitted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_expense_claims_employee FOREIGN KEY (employee_id) REFERENCES users(id),
    CONSTRAINT fk_expense_claims_category FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    CONSTRAINT ck_expense_claims_amount_positive CHECK (amount > 0)
);

CREATE INDEX ix_expense_claims_employee ON expense_claims (employee_id);
CREATE INDEX ix_expense_claims_status ON expense_claims (status);
CREATE INDEX ix_expense_claims_category ON expense_claims (category_id);
CREATE INDEX ix_expense_claims_transaction_date ON expense_claims (transaction_date);
