package com.fintwin.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * AnalyticsResult entity storing computed financial scores and insights.
 */
@Entity
@Table(name = "analytics_results", indexes = {
        @Index(name = "idx_analytics_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Financial Habit Score: 0–100 */
    @Column(nullable = false)
    private int financialHabitScore;

    /** Alternative Credit Score: 300–900 */
    @Column(nullable = false)
    private int creditScore;

    /** Total monthly subscription cost */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subscriptionWaste;

    /** Total monthly spending */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlySpending;

    /** Savings ratio (0.0 to 1.0) */
    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal savingsRatio;

    /** Spending stability score (0.0 to 1.0) */
    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal spendingStability;

    @Column(nullable = false, updatable = false)
    private LocalDateTime computedAt;

    @PrePersist
    protected void onCreate() {
        this.computedAt = LocalDateTime.now();
    }
}
