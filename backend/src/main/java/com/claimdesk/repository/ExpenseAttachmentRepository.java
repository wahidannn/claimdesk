package com.claimdesk.repository;

import com.claimdesk.entity.ExpenseAttachment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseAttachmentRepository extends JpaRepository<ExpenseAttachment, Long> {

    List<ExpenseAttachment> findByClaimIdOrderByUploadedAtDesc(Long claimId);
}
