package com.fintwin.repository;

import com.fintwin.model.AnalyticsResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for AnalyticsResult entity.
 */
@Repository
public interface AnalyticsResultRepository extends JpaRepository<AnalyticsResult, Long> {

    Optional<AnalyticsResult> findTopByUserIdOrderByComputedAtDesc(Long userId);

    void deleteByUserId(Long userId);
}
