package com.claimdesk.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "approval_notes")
public class ApprovalNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", nullable = false)
    private ExpenseClaim claim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ApprovalAction action;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected ApprovalNote() {
    }

    public ApprovalNote(ExpenseClaim claim, User reviewer, ApprovalAction action, String note) {
        this.claim = claim;
        this.reviewer = reviewer;
        this.action = action;
        this.note = note;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public ExpenseClaim getClaim() {
        return claim;
    }

    public User getReviewer() {
        return reviewer;
    }

    public ApprovalAction getAction() {
        return action;
    }

    public String getNote() {
        return note;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
