package com.fintwin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * DTO for the dashboard overview API response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewDTO {

    private int financialHabitScore;
    private int creditScore;
    private BigDecimal subscriptionWaste;
    private BigDecimal monthlySpending;
    private BigDecimal savingsRatio;
    private BigDecimal spendingStability;

    /** Spending breakdown by category */
    private Map<String, BigDecimal> categoryBreakdown;

    /** List of detected subscriptions */
    private List<SubscriptionDTO> subscriptions;

    /** Top 5 most expensive transactions */
    private List<TransactionDTO> topTransactions;

    /** Credit score rating label */
    private String creditScoreRating;

    /** Habit score rating label */
    private String habitScoreRating;
}
