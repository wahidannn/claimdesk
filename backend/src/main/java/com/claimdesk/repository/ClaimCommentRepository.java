package com.claimdesk.repository;

import com.claimdesk.entity.ClaimComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaimCommentRepository extends JpaRepository<ClaimComment, Long> {

    List<ClaimComment> findByClaimIdOrderByCreatedAtAsc(Long claimId);
}
