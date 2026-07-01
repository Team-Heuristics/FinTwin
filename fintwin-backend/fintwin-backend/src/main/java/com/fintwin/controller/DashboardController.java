package com.fintwin.controller;

import com.fintwin.dto.ApiResponse;
import com.fintwin.dto.DashboardOverviewDTO;
import com.fintwin.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the main dashboard overview.
 *
 * GET /api/dashboard/overview
 *
 * Response example:
 * {
 *   "financialHabitScore": 74,
 *   "creditScore": 742,
 *   "subscriptionWaste": 899.00,
 *   "monthlySpending": 12500.00,
 *   "savingsRatio": 0.7500,
 *   "spendingStability": 0.8200,
 *   "creditScoreRating": "Very Good",
 *   "habitScoreRating": "Good",
 *   "categoryBreakdown": { "FOOD": 4500.00, "SUBSCRIPTIONS": 899.00, ... },
 *   "subscriptions": [ ... ],
 *   "topTransactions": [ ... ]
 * }
 */
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    /**
     * Get the full dashboard overview for the authenticated user.
     */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DashboardOverviewDTO>> getOverview(
            @AuthenticationPrincipal UserDetails userDetails) {

        DashboardOverviewDTO overview = dashboardService.getOverview(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Dashboard overview retrieved", overview));
    }
}
