ALTER TABLE expense_claims
    ADD COLUMN manager_reviewed_at TIMESTAMPTZ,
    ADD COLUMN finance_reviewed_at TIMESTAMPTZ,
    ADD COLUMN paid_at TIMESTAMPTZ;

CREATE TABLE approval_notes (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL REFERENCES expense_claims(id),
    reviewer_id BIGINT NOT NULL REFERENCES users(id),
    action VARCHAR(40) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_approval_notes_claim_id ON approval_notes(claim_id);
CREATE INDEX idx_approval_notes_reviewer_id ON approval_notes(reviewer_id);
CREATE INDEX idx_approval_notes_action ON approval_notes(action);
