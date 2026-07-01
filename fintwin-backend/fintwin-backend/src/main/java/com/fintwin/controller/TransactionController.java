package com.fintwin.controller;

import com.fintwin.dto.ApiResponse;
import com.fintwin.dto.TransactionDTO;
import com.fintwin.dto.UploadResponse;
import com.fintwin.service.AnalyticsService;
import com.fintwin.service.SubscriptionService;
import com.fintwin.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST controller for bank transaction upload and retrieval.
 *
 * All endpoints require JWT authentication (Authorization: Bearer <token>).
 *
 *   POST /api/transactions/upload    — Upload CSV file
 *   GET  /api/transactions           — List all transactions
 */
@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private SubscriptionService subscriptionService;

    /**
     * Upload a CSV file of bank transactions.
     *
     * Multipart form-data:
     *   file: <CSV file>
     *
     * CSV format:
     *   date,description,amount
     *   2026-03-01,Swiggy,450
     *   2026-03-02,Netflix,199
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<UploadResponse>> uploadTransactions(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        String email = userDetails.getUsername();

        // Parse and save transactions
        UploadResponse uploadResponse = transactionService.uploadTransactions(email, file);

        if (uploadResponse.getParsedSuccessfully() == 0) {
            String message = "No valid transactions were parsed. Ensure CSV has date, description, amount columns.";
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(message));
        }

        // Detect subscriptions
        subscriptionService.detectAndSaveSubscriptions(email);

        // Recompute analytics
        analyticsService.computeAndSave(email);

        return ResponseEntity.ok(ApiResponse.success(
                "CSV uploaded and processed successfully", uploadResponse));
    }

    /**
     * Get all transactions for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionDTO>>> getTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<TransactionDTO> transactions = transactionService.getUserTransactions(
                userDetails.getUsername());

        return ResponseEntity.ok(ApiResponse.success(
                "Transactions retrieved successfully", transactions));
    }
}