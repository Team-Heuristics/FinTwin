package com.fintwin.service;

import com.fintwin.dto.SubscriptionDTO;
import com.fintwin.model.Subscription;
import com.fintwin.model.Transaction;
import com.fintwin.model.User;
import com.fintwin.repository.SubscriptionRepository;
import com.fintwin.repository.TransactionRepository;
import com.fintwin.repository.UserRepository;
import com.fintwin.util.TransactionCategorizationUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for detecting and managing recurring subscription payments.
 *
 * Detection logic:
 *  - Transactions flagged as subscriptions (keyword match) are grouped by service name.
 *  - Groups with ≥ 2 occurrences are persisted as Subscription records.
 *  - Monthly amount = average amount across all occurrences.
 */
@Service
public class SubscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionCategorizationUtil categorizationUtil;

    /**
     * Detect subscriptions for a user and persist them.
     */
    @Transactional
    public List<SubscriptionDTO> detectAndSaveSubscriptions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Transaction> subscriptionTransactions =
                transactionRepository.findByUserIdAndIsSubscriptionTrue(user.getId());

        // Group by normalized service name
        Map<String, List<Transaction>> grouped = subscriptionTransactions.stream()
                .collect(Collectors.groupingBy(t -> {
                    String name = categorizationUtil.getSubscriptionServiceName(t.getDescription());
                    return name != null ? name : categorizationUtil.normalize(t.getDescription());
                }));

        // Clear old subscriptions and rebuild
        subscriptionRepository.deleteByUserId(user.getId());

        List<Subscription> subscriptions = new ArrayList<>();
        for (Map.Entry<String, List<Transaction>> entry : grouped.entrySet()) {
            String serviceName = entry.getKey();
            List<Transaction> txs = entry.getValue();

            if (txs.size() < 2) continue; // Require recurring pattern (at least 2 occurrences)

            BigDecimal avgAmount = txs.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(txs.size()), 2, RoundingMode.HALF_UP);

            Subscription sub = Subscription.builder()
                    .user(user)
                    .serviceName(serviceName)
                    .monthlyAmount(avgAmount)
                    .occurrenceCount(txs.size())
                    .isActive(true)
                    .build();

            subscriptions.add(subscriptionRepository.save(sub));
        }

        logger.info("Detected {} subscriptions for user {}", subscriptions.size(), userEmail);

        return subscriptions.stream().map(this::toDTO).toList();
    }

    /**
     * Get all active subscriptions for a user.
     */
    public List<SubscriptionDTO> getUserSubscriptions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Subscription> subs = subscriptionRepository.findByUserIdAndIsActiveTrue(user.getId());
        if (subs.isEmpty()) {
            // Auto-detect if none found
            return detectAndSaveSubscriptions(userEmail);
        }
        return subs.stream().map(this::toDTO).toList();
    }

    /**
     * Get total monthly subscription waste for a user.
     */
    public BigDecimal getTotalSubscriptionWaste(Long userId) {
        BigDecimal total = subscriptionRepository.sumMonthlyAmountByUserId(userId);
        return total != null ? total : BigDecimal.ZERO;
    }

    public SubscriptionDTO toDTO(Subscription s) {
        return SubscriptionDTO.builder()
                .id(s.getId())
                .serviceName(s.getServiceName())
                .monthlyAmount(s.getMonthlyAmount())
                .occurrenceCount(s.getOccurrenceCount())
                .active(s.isActive())
                .build();
    }
}
