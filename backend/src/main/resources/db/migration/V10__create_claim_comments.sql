CREATE TABLE claim_comments (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_claim_comments_claim FOREIGN KEY (claim_id) REFERENCES expense_claims(id),
    CONSTRAINT fk_claim_comments_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_claim_comments_claim_id ON claim_comments(claim_id);
CREATE INDEX idx_claim_comments_author_id ON claim_comments(author_id);
CREATE INDEX idx_claim_comments_created_at ON claim_comments(created_at);
