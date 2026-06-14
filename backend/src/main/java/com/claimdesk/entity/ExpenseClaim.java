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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "expense_claims")
public class ExpenseClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ExpenseCategory category;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ClaimStatus status;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "manager_reviewed_at")
    private OffsetDateTime managerReviewedAt;

    @Column(name = "finance_reviewed_at")
    private OffsetDateTime financeReviewedAt;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected ExpenseClaim() {
    }

    public ExpenseClaim(
            User employee,
            ExpenseCategory category,
            String title,
            String description,
            BigDecimal amount,
            LocalDate transactionDate
    ) {
        this.employee = employee;
        this.category = category;
        this.title = title;
        this.description = description;
        this.amount = amount;
        this.transactionDate = transactionDate;
        this.status = ClaimStatus.DRAFT;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    public Long getId() {
        return id;
    }

    public User getEmployee() {
        return employee;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public OffsetDateTime getSubmittedAt() {
        return submittedAt;
    }

    public OffsetDateTime getManagerReviewedAt() {
        return managerReviewedAt;
    }

    public OffsetDateTime getFinanceReviewedAt() {
        return financeReviewedAt;
    }

    public OffsetDateTime getPaidAt() {
        return paidAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void updateDraft(ExpenseCategory category, String title, String description, BigDecimal amount, LocalDate transactionDate) {
        this.category = category;
        this.title = title;
        this.description = description;
        this.amount = amount;
        this.transactionDate = transactionDate;
        this.updatedAt = OffsetDateTime.now();
    }

    public void submit() {
        this.status = ClaimStatus.SUBMITTED;
        this.submittedAt = OffsetDateTime.now();
        this.updatedAt = this.submittedAt;
    }

    public void cancel() {
        this.status = ClaimStatus.CANCELLED;
        this.updatedAt = OffsetDateTime.now();
    }

    public void managerApprove() {
        this.status = ClaimStatus.MANAGER_APPROVED;
        this.managerReviewedAt = OffsetDateTime.now();
        this.updatedAt = this.managerReviewedAt;
    }

    public void managerReject() {
        this.status = ClaimStatus.MANAGER_REJECTED;
        this.managerReviewedAt = OffsetDateTime.now();
        this.updatedAt = this.managerReviewedAt;
    }

    public void financeApprove() {
        this.status = ClaimStatus.FINANCE_APPROVED;
        this.financeReviewedAt = OffsetDateTime.now();
        this.updatedAt = this.financeReviewedAt;
    }

    public void markPaid() {
        this.status = ClaimStatus.PAID;
        this.paidAt = OffsetDateTime.now();
        this.updatedAt = this.paidAt;
    }
}
