package com.fintwin.service;

import com.fintwin.model.AnalyticsResult;
import com.fintwin.model.Transaction;
import com.fintwin.model.Transaction.TransactionCategory;
import com.fintwin.model.User;
import com.fintwin.repository.AnalyticsResultRepository;
import com.fintwin.repository.TransactionRepository;
import com.fintwin.repository.UserRepository;
import com.fintwin.util.TransactionCategorizationUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core analytics engine for FinTwin.
 *
 * Computes:
 *  - Financial Habit Score (0–100)
 *  - Alternative Credit Score (300–900)
 *  - Subscription waste
 *  - Category breakdowns
 */
@Service
public class AnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsService.class);

    // Estimated monthly income assumption (can be made configurable)
    private static final BigDecimal ASSUMED_MONTHLY_INCOME = new BigDecimal("50000");

    @Autowired
    private AnalyticsResultRepository analyticsResultRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private TransactionCategorizationUtil categorizationUtil;

    /**
     * Compute and persist all analytics for a user.
     * Called after transaction upload.
     */
    @Transactional
    public AnalyticsResult computeAndSave(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Transaction> transactions = transactionRepository
                .findByUserIdOrderByTransactionDateDesc(user.getId());

        if (transactions.isEmpty()) {
            throw new IllegalStateException("No transactions found. Please upload a CSV first.");
        }

        // Exclude income/credit inflows from spending analytics.
        List<Transaction> spendingTransactions = transactions.stream()
            .filter(t -> !categorizationUtil.isIncomeLike(t.getDescription()))
            .toList();

        if (spendingTransactions.isEmpty()) {
            throw new IllegalStateException("No spending transactions found. Please upload expense entries in CSV.");
        }

        BigDecimal totalSpending = spendingTransactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal subscriptionWaste = subscriptionService.getTotalSubscriptionWaste(user.getId());

        BigDecimal savingsRatio = computeSavingsRatio(totalSpending);
        BigDecimal spendingStability = computeSpendingStability(spendingTransactions);

        int habitScore = computeHabitScore(savingsRatio, spendingStability, subscriptionWaste, totalSpending);
        int creditScore = computeCreditScore(habitScore, savingsRatio, spendingTransactions.size(), totalSpending);

        // Delete old result and insert fresh
        analyticsResultRepository.deleteByUserId(user.getId());

        AnalyticsResult result = AnalyticsResult.builder()
                .user(user)
                .financialHabitScore(habitScore)
                .creditScore(creditScore)
                .subscriptionWaste(subscriptionWaste)
                .monthlySpending(totalSpending)
                .savingsRatio(savingsRatio)
                .spendingStability(spendingStability)
                .build();

        AnalyticsResult saved = analyticsResultRepository.save(result);
        logger.info("Analytics computed for {}: habit={}, credit={}", userEmail, habitScore, creditScore);
        return saved;
    }

    /**
     * Get (or compute) the latest analytics result for a user.
     */
    public AnalyticsResult getOrCompute(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return analyticsResultRepository.findTopByUserIdOrderByComputedAtDesc(user.getId())
                .orElseGet(() -> computeAndSave(userEmail));
    }

    /**
     * Financial Habit Score: 0–100
     *
     * Components:
     *  - Savings ratio:         40 points (the more you save, the better)
     *  - Spending stability:    30 points (consistent spending patterns are healthy)
     *  - Subscription burden:   20 points (high subscription waste lowers score)
     *  - Transaction activity:  10 points (regular transactions show financial activity)
     */
    private int computeHabitScore(BigDecimal savingsRatio,
                                   BigDecimal spendingStability,
                                   BigDecimal subscriptionWaste,
                                   BigDecimal totalSpending) {
        double savings = savingsRatio.doubleValue();        // 0.0–1.0
        double stability = spendingStability.doubleValue(); // 0.0–1.0

        // Savings component: max 40 pts
        double savingsScore = Math.min(savings * 1.5, 1.0) * 40.0;

        // Stability component: max 30 pts
        double stabilityScore = stability * 30.0;

        // Subscription burden: max 20 pts (penalise high subscription waste ratio)
        double subRatio = 0.0;
        if (totalSpending.compareTo(BigDecimal.ZERO) > 0) {
            subRatio = subscriptionWaste.doubleValue() / totalSpending.doubleValue();
        }
        double subScore = Math.max(0.0, (1.0 - subRatio * 3.0)) * 20.0;

        // Activity: always 10 pts (has transactions)
        double activityScore = 10.0;

        int score = (int) Math.round(savingsScore + stabilityScore + subScore + activityScore);
        return Math.min(100, Math.max(0, score));
    }

    /**
     * Alternative Credit Score: 300–900
     *
     * Based on behavioral financial analysis:
     *  - Financial habit score is the primary driver (maps 0–100 → 300–900)
     *  - Modulated by savings ratio and transaction count
     */
    private int computeCreditScore(int habitScore,
                                    BigDecimal savingsRatio,
                                    int transactionCount,
                                    BigDecimal totalSpending) {
        // Base: map habit score from 0–100 to 300–900 range
        double base = 300.0 + (habitScore / 100.0) * 600.0;

        // Savings bonus: up to +60 pts for high savings
        double savingsBonus = savingsRatio.doubleValue() * 60.0;

        // Transaction activity bonus: up to +30 pts
        double activityBonus = Math.min(transactionCount / 50.0, 1.0) * 30.0;

        // High spending penalty: if spending > 80% of income, penalise
        double spendRatio = totalSpending.doubleValue() / ASSUMED_MONTHLY_INCOME.doubleValue();
        double spendingPenalty = spendRatio > 0.8 ? (spendRatio - 0.8) * 100.0 : 0.0;

        int score = (int) Math.round(base + savingsBonus + activityBonus - spendingPenalty);
        return Math.min(900, Math.max(300, score));
    }

    /**
     * Savings ratio = (assumed income - spending) / assumed income
     * Capped between 0.0 and 1.0.
     */
    private BigDecimal computeSavingsRatio(BigDecimal totalSpending) {
        BigDecimal saved = ASSUMED_MONTHLY_INCOME.subtract(totalSpending);
        if (saved.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        BigDecimal ratio = saved.divide(ASSUMED_MONTHLY_INCOME, 4, RoundingMode.HALF_UP);
        return ratio.min(BigDecimal.ONE);
    }

    /**
     * Spending stability = inverse of coefficient of variation across daily spending.
     * High stability (low CV) → score near 1.0.
     * Erratic spending → score near 0.0.
     */
    private BigDecimal computeSpendingStability(List<Transaction> transactions) {
        if (transactions.size() < 2) return new BigDecimal("0.5");

        // Group by date and sum
        Map<String, BigDecimal> dailySpending = transactions.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getTransactionDate().toString(),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        List<Double> amounts = dailySpending.values().stream()
                .map(BigDecimal::doubleValue)
                .collect(Collectors.toList());

        double mean = amounts.stream().mapToDouble(d -> d).average().orElse(0.0);
        if (mean == 0.0) return new BigDecimal("0.5");

        double variance = amounts.stream()
                .mapToDouble(d -> Math.pow(d - mean, 2))
                .average()
                .orElse(0.0);

        double stdDev = Math.sqrt(variance);
        double cv = stdDev / mean; // Coefficient of Variation

        // Invert and normalise: CV=0 → stability=1.0, CV=2 → stability≈0
        double stability = Math.max(0.0, 1.0 - (cv / 2.0));
        return BigDecimal.valueOf(stability).setScale(4, RoundingMode.HALF_UP);
    }

    /**
     * Get spending breakdown by category for a user.
     */
    public Map<String, BigDecimal> getCategoryBreakdown(Long userId) {
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByTransactionDateDesc(userId);

        return transactions.stream()
                .filter(t -> !categorizationUtil.isIncomeLike(t.getDescription()))
                .collect(Collectors.groupingBy(
                        t -> t.getCategory().name(),
                        LinkedHashMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));
    }

    public String getCreditScoreRating(int score) {
        if (score >= 800) return "Excellent";
        if (score >= 740) return "Very Good";
        if (score >= 670) return "Good";
        if (score >= 580) return "Fair";
        return "Poor";
    }

    public String getHabitScoreRating(int score) {
        if (score >= 80) return "Excellent";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        return "Needs Improvement";
    }
}
