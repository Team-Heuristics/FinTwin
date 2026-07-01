package com.fintwin.dto;

import com.fintwin.model.Transaction.TransactionCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for Transaction response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {

    private Long id;
    private LocalDate transactionDate;
    private String description;
    private String normalizedDescription;
    private BigDecimal amount;
    private TransactionCategory category;
    private boolean subscription;
}
