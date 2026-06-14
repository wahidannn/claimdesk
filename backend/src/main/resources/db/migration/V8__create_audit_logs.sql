CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES users(id),
    actor_email VARCHAR(160),
    actor_role VARCHAR(30),
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id BIGINT,
    description TEXT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_actor_email ON audit_logs(actor_email);
CREATE INDEX idx_audit_logs_actor_role ON audit_logs(actor_role);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
