package com.claimdesk.repository;

import com.claimdesk.entity.ApprovalNote;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalNoteRepository extends JpaRepository<ApprovalNote, Long> {

    List<ApprovalNote> findByClaimIdOrderByCreatedAtAsc(Long claimId);
}
