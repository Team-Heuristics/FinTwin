package com.fintwin.controller;

import com.fintwin.dto.ApiResponse;
import com.fintwin.dto.SubscriptionDTO;
import com.fintwin.model.AnalyticsResult;
import com.fintwin.service.AnalyticsService;
import com.fintwin.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for financial analytics APIs.
 *
 * All endpoints require JWT authentication.
 *
 *   GET /api/analytics/subscriptions   — List detected subscriptions
 *   GET /api/analytics/habit-score     — Financial Habit Score (0–100)
 *   GET /api/analytics/credit-score    — Alternative Credit Score (300–900)
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private SubscriptionService subscriptionService;

    /**
     * Get all detected subscription services for the authenticated user.
     *
     * Response example:
     * [
     *   { "serviceName": "Netflix", "monthlyAmount": 199.00, "occurrenceCount": 3, "active": true },
     *   { "serviceName": "Spotify", "monthlyAmount": 119.00, "occurrenceCount": 2, "active": true }
     * ]
     */
    @GetMapping("/subscriptions")
    public ResponseEntity<ApiResponse<List<SubscriptionDTO>>> getSubscriptions(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<SubscriptionDTO> subscriptions = subscriptionService
                .getUserSubscriptions(userDetails.getUsername());

        return ResponseEntity.ok(ApiResponse.success(
                "Subscriptions retrieved successfully", subscriptions));
    }

    /**
     * Get the Financial Habit Score for the authenticated user.
     *
     * Response example:
     * { "score": 74, "rating": "Good", "breakdown": { ... } }
     */
    @GetMapping("/habit-score")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHabitScore(
            @AuthenticationPrincipal UserDetails userDetails) {

        AnalyticsResult result = analyticsService.getOrCompute(userDetails.getUsername());

        Map<String, Object> response = Map.of(
                "score", result.getFinancialHabitScore(),
                "rating", analyticsService.getHabitScoreRating(result.getFinancialHabitScore()),
                "savingsRatio", result.getSavingsRatio(),
                "spendingStability", result.getSpendingStability(),
                "subscriptionWaste", result.getSubscriptionWaste()
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Financial Habit Score computed", response));
    }

    /**
     * Get the Alternative Credit Score for the authenticated user.
     *
     * Response example:
     * { "score": 742, "rating": "Very Good" }
     */
    @GetMapping("/credit-score")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCreditScore(
            @AuthenticationPrincipal UserDetails userDetails) {

        AnalyticsResult result = analyticsService.getOrCompute(userDetails.getUsername());

        Map<String, Object> response = Map.of(
                "score", result.getCreditScore(),
                "rating", analyticsService.getCreditScoreRating(result.getCreditScore()),
                "monthlySpending", result.getMonthlySpending()
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Alternative Credit Score computed", response));
    }

    /**
     * Trigger recomputation of all analytics for the authenticated user.
     */
    @PostMapping("/recompute")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recompute(
            @AuthenticationPrincipal UserDetails userDetails) {

        subscriptionService.detectAndSaveSubscriptions(userDetails.getUsername());
        AnalyticsResult result = analyticsService.computeAndSave(userDetails.getUsername());

        Map<String, Object> response = Map.of(
                "habitScore", result.getFinancialHabitScore(),
                "creditScore", result.getCreditScore(),
                "message", "Analytics recomputed successfully"
        );

        return ResponseEntity.ok(ApiResponse.success("Analytics recomputed", response));
    }
}