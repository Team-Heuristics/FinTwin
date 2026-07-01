package com.fintwin.service;

import com.fintwin.dto.TransactionDTO;
import com.fintwin.dto.UploadResponse;
import com.fintwin.model.Transaction;
import com.fintwin.model.Transaction.TransactionCategory;
import com.fintwin.model.User;
import com.fintwin.repository.TransactionRepository;
import com.fintwin.repository.UserRepository;
import com.fintwin.util.TransactionCategorizationUtil;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for parsing, storing, and retrieving bank transactions from CSV uploads.
 */
@Service
public class TransactionService {

    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy")
    );

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionCategorizationUtil categorizationUtil;

    /**
     * Parse and store transactions from an uploaded CSV file.
     */
    @Transactional
    public UploadResponse uploadTransactions(String userEmail, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is empty");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("Only CSV files are accepted");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        List<Transaction> parsedTransactions = new ArrayList<>();
        List<Transaction> savedTransactions = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int rowNumber = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT
                     .builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .build())) {

            for (CSVRecord record : csvParser) {
                rowNumber++;
                try {
                    Transaction transaction = parseRecord(record, user, rowNumber);
                    parsedTransactions.add(transaction);
                } catch (Exception e) {
                    String errorMsg = "Row " + rowNumber + ": " + e.getMessage();
                    errors.add(errorMsg);
                    logger.warn("CSV parse error — {}", errorMsg);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage(), e);
        }

        if (!parsedTransactions.isEmpty()) {
            // Replace previous uploaded dataset to keep analytics tied to latest statement.
            transactionRepository.deleteByUserId(user.getId());
            savedTransactions = transactionRepository.saveAll(parsedTransactions);
        }

        logger.info("CSV upload complete for user {}: {} saved, {} errors",
                userEmail, savedTransactions.size(), errors.size());

        return UploadResponse.builder()
                .totalRows(rowNumber)
                .parsedSuccessfully(savedTransactions.size())
                .failedRows(errors.size())
                .message(String.format("Processed %d rows. %d saved, %d failed.",
                        rowNumber, savedTransactions.size(), errors.size()))
                .transactions(savedTransactions.stream().map(this::toDTO).toList())
                .errors(errors)
                .build();
    }

    private Transaction parseRecord(CSVRecord record, User user, int rowNumber) {
        // Validate required columns
        if (!record.isMapped("date") || !record.isMapped("description") || !record.isMapped("amount")) {
            throw new IllegalArgumentException(
                    "Missing required columns. Expected: date, description, amount");
        }

        String dateStr = record.get("date").trim();
        String description = record.get("description").trim();
        String amountStr = record.get("amount").trim();

        if (dateStr.isEmpty() || description.isEmpty() || amountStr.isEmpty()) {
            throw new IllegalArgumentException("Empty values in required fields");
        }

        LocalDate date = parseDate(dateStr);
        BigDecimal amount = parseAmount(amountStr);
        String normalized = categorizationUtil.normalize(description);
        TransactionCategory category = categorizationUtil.categorize(description);
        boolean isSubscription = categorizationUtil.isSubscription(description);

        return Transaction.builder()
                .user(user)
                .transactionDate(date)
                .description(description)
                .normalizedDescription(normalized)
                .amount(amount)
                .category(category)
                .isSubscription(isSubscription)
                .build();
    }

    private LocalDate parseDate(String dateStr) {
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        throw new IllegalArgumentException("Cannot parse date: '" + dateStr +
                "'. Supported formats: yyyy-MM-dd, dd/MM/yyyy, MM/dd/yyyy, dd-MM-yyyy");
    }

    private BigDecimal parseAmount(String amountStr) {
        try {
            // Remove currency symbols and commas
            String cleaned = amountStr.replaceAll("[₹$€£,\\s]", "");
            BigDecimal amount = new BigDecimal(cleaned);
            if (amount.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Amount cannot be negative: " + amountStr);
            }
            return amount;
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Cannot parse amount: '" + amountStr + "'");
        }
    }

    /**
     * Get all transactions for a user.
     */
    public List<TransactionDTO> getUserTransactions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(user.getId())
                .stream().map(this::toDTO).toList();
    }

    public TransactionDTO toDTO(Transaction t) {
        return TransactionDTO.builder()
                .id(t.getId())
                .transactionDate(t.getTransactionDate())
                .description(t.getDescription())
                .normalizedDescription(t.getNormalizedDescription())
                .amount(t.getAmount())
                .category(t.getCategory())
                .subscription(t.isSubscription())
                .build();
    }
}
