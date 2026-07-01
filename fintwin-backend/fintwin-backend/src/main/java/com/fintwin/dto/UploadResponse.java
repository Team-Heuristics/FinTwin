package com.fintwin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for CSV upload response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResponse {

    private int totalRows;
    private int parsedSuccessfully;
    private int failedRows;
    private String message;
    private List<TransactionDTO> transactions;
    private List<String> errors;
}
