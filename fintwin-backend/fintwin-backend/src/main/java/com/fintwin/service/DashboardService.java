package com.fintwin.service;

import com.fintwin.dto.DashboardOverviewDTO;
import com.fintwin.dto.SubscriptionDTO;
import com.fintwin.dto.TransactionDTO;
import com.fintwin.model.AnalyticsResult;
import com.fintwin.model.Transaction;
import com.fintwin.model.User;
import com.fintwin.repository.TransactionRepository;
import com.fintwin.repository.UserRepository;
import com.fintwin.util.TransactionCategorizationUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Comparator;

/**
 * Service for assembling the dashboard overview response.
 */
@Service
public class DashboardService {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionService transactionService;

        @Autowired
        private TransactionCategorizationUtil categorizationUtil;

    /**
     * Build the full dashboard overview for a user.
     */
    public DashboardOverviewDTO getOverview(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        AnalyticsResult analytics = analyticsService.getOrCompute(userEmail);
        List<SubscriptionDTO> subscriptions = subscriptionService.getUserSubscriptions(userEmail);
        Map<String, BigDecimal> breakdown = analyticsService.getCategoryBreakdown(user.getId());

        List<TransactionDTO> topTransactions = transactionRepository
                .findByUserIdOrderByTransactionDateDesc(user.getId())
                .stream()
                .filter(t -> !categorizationUtil.isIncomeLike(t.getDescription()))
                .sorted(Comparator.comparing(Transaction::getAmount).reversed())
                .limit(5)
                .map(transactionService::toDTO)
                .toList();

        return DashboardOverviewDTO.builder()
                .financialHabitScore(analytics.getFinancialHabitScore())
                .creditScore(analytics.getCreditScore())
                .subscriptionWaste(analytics.getSubscriptionWaste())
                .monthlySpending(analytics.getMonthlySpending())
                .savingsRatio(analytics.getSavingsRatio())
                .spendingStability(analytics.getSpendingStability())
                .categoryBreakdown(breakdown)
                .subscriptions(subscriptions)
                .topTransactions(topTransactions)
                .creditScoreRating(analyticsService.getCreditScoreRating(analytics.getCreditScore()))
                .habitScoreRating(analyticsService.getHabitScoreRating(analytics.getFinancialHabitScore()))
                .build();
    }
}
