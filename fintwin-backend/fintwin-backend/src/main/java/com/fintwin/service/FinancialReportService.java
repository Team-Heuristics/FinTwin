package com.fintwin.service;

import com.fintwin.dto.DashboardOverviewDTO;
import com.fintwin.dto.SubscriptionDTO;
import com.fintwin.model.User;
import com.fintwin.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.Map;

/**
 * Builds and sends the latest financial summary report for a user.
 */
@Service
public class FinancialReportService {

    private static final String REPORT_SUBJECT = "FinTwin Financial Health Report";

    private final DashboardService dashboardService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public FinancialReportService(DashboardService dashboardService,
                                  UserRepository userRepository,
                                  EmailService emailService) {
        this.dashboardService = dashboardService;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public void sendLatestReport(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        DashboardOverviewDTO overview = dashboardService.getOverview(userEmail);
        String reportBody = buildReportBody(user.getFullName(), overview);
        emailService.sendReportEmail(user.getEmail(), REPORT_SUBJECT, reportBody);
    }

    private String buildReportBody(String userName, DashboardOverviewDTO overview) {
        String recommendation = buildRecommendation(overview);
        String topCategory = getTopCategoryLabel(overview.getCategoryBreakdown());

        return String.format(
                "Hi %s,%n%n" +
                "Here is your latest financial summary:%n%n" +
                "Financial Health Score: %d/100%n" +
                "Alternative Credit Score: %d%n%n" +
                "Savings Ratio: %s%%%n" +
                "Monthly Spending: %s%n" +
                "Subscription Spending: %s%n" +
                "Top Spending Category: %s%n%n" +
                "Recommendation:%n" +
                "%s%n%n" +
                "View full insights in your FinTwin dashboard.%n",
                userName,
                overview.getFinancialHabitScore(),
                overview.getCreditScore(),
                formatPercentage(overview.getSavingsRatio()),
                formatCurrency(overview.getMonthlySpending()),
                formatCurrency(getSubscriptionSpending(overview)),
                topCategory,
                recommendation
        );
    }

    private BigDecimal getSubscriptionSpending(DashboardOverviewDTO overview) {
        return overview.getSubscriptions() == null
                ? BigDecimal.ZERO
                : overview.getSubscriptions().stream()
                .map(SubscriptionDTO::getMonthlyAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String getTopCategoryLabel(Map<String, BigDecimal> categoryBreakdown) {
        if (categoryBreakdown == null || categoryBreakdown.isEmpty()) {
            return "No category data available";
        }

        return categoryBreakdown.entrySet().stream()
                .max(Comparator.comparing(Map.Entry::getValue))
                .map(entry -> entry.getKey() + " (" + formatCurrency(entry.getValue()) + ")")
                .orElse("No category data available");
    }

    private String buildRecommendation(DashboardOverviewDTO overview) {
        if (overview.getSubscriptions() != null && !overview.getSubscriptions().isEmpty()) {
            SubscriptionDTO topSubscription = overview.getSubscriptions().stream()
                    .max(Comparator.comparing(SubscriptionDTO::getMonthlyAmount))
                    .orElse(null);

            if (topSubscription != null) {
                return String.format("Cancel %s to save %s/month and improve your financial health score.",
                        topSubscription.getServiceName(),
                        formatCurrency(topSubscription.getMonthlyAmount()));
            }
        }

        if (overview.getSavingsRatio() != null && overview.getSavingsRatio().compareTo(new BigDecimal("0.20")) < 0) {
            return "Increase savings above 20% of assumed monthly income to strengthen both habit and credit scores.";
        }

        return "Maintain your current savings discipline and keep your largest spending category under control.";
    }

    private String formatPercentage(BigDecimal ratio) {
        BigDecimal safeRatio = ratio == null ? BigDecimal.ZERO : ratio;
        return safeRatio.multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString();
    }

    private String formatCurrency(BigDecimal amount) {
        BigDecimal safeAmount = amount == null ? BigDecimal.ZERO : amount;
        return "₹" + safeAmount.stripTrailingZeros().toPlainString();
    }
}
