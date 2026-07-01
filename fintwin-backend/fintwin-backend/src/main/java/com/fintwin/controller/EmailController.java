package com.fintwin.controller;

import com.fintwin.dto.ApiResponse;
import com.fintwin.service.FinancialReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for sending financial summary emails.
 */
@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EmailController {

    private final FinancialReportService financialReportService;

    public EmailController(FinancialReportService financialReportService) {
        this.financialReportService = financialReportService;
    }

    @PostMapping("/send-report")
    public ResponseEntity<ApiResponse<String>> sendReport(@AuthenticationPrincipal UserDetails userDetails) {
        financialReportService.sendLatestReport(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(
                "Financial report sent to your email.",
                userDetails.getUsername()
        ));
    }
}