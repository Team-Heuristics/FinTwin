package com.fintwin.repository;

import com.fintwin.model.Transaction;
import com.fintwin.model.Transaction.TransactionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Repository for Transaction entity.
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId);

    List<Transaction> findByUserIdAndIsSubscriptionTrue(Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId ORDER BY t.amount DESC LIMIT 5")
    List<Transaction> findTop5ByUserIdOrderByAmountDesc(@Param("userId") Long userId);

    @Query("SELECT t.category AS category, SUM(t.amount) AS total FROM Transaction t WHERE t.user.id = :userId GROUP BY t.category")
    List<Object[]> findCategoryBreakdownByUserId(@Param("userId") Long userId);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId")
    BigDecimal sumAmountByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT t.normalizedDescription, COUNT(t), SUM(t.amount), AVG(t.amount) " +
           "FROM Transaction t WHERE t.user.id = :userId " +
           "GROUP BY t.normalizedDescription " +
           "HAVING COUNT(t) >= 2 " +
           "ORDER BY COUNT(t) DESC")
    List<Object[]> findRecurringTransactions(@Param("userId") Long userId);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.isSubscription = true")
    BigDecimal sumSubscriptionAmountByUserId(@Param("userId") Long userId);

    void deleteByUserId(Long userId);
}