CREATE TABLE expense_attachments (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(120) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_expense_attachments_claim FOREIGN KEY (claim_id) REFERENCES expense_claims(id)
);

CREATE INDEX ix_expense_attachments_claim ON expense_attachments (claim_id);
