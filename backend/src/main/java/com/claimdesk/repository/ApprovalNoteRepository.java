package com.claimdesk.repository;

import com.claimdesk.entity.ApprovalNote;
import com.claimdesk.entity.ApprovalAction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalNoteRepository extends JpaRepository<ApprovalNote, Long> {

    List<ApprovalNote> findByClaimIdOrderByCreatedAtAsc(Long claimId);

    Optional<ApprovalNote> findTopByClaimIdAndActionOrderByCreatedAtDesc(Long claimId, ApprovalAction action);
}
