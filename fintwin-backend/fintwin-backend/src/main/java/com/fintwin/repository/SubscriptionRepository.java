package com.fintwin.repository;

import com.fintwin.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Subscription entity.
 */
@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByUserIdAndIsActiveTrue(Long userId);

    List<Subscription> findByUserId(Long userId);

    Optional<Subscription> findByUserIdAndServiceName(Long userId, String serviceName);

    @Query("SELECT SUM(s.monthlyAmount) FROM Subscription s WHERE s.user.id = :userId AND s.isActive = true")
    BigDecimal sumMonthlyAmountByUserId(@Param("userId") Long userId);

    void deleteByUserId(Long userId);
}