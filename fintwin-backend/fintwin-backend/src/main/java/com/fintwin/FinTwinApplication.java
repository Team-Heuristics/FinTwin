package com.fintwin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * FinTwin Backend - Fintech Analytics Platform
 * Main entry point for the Spring Boot application.
 */
@SpringBootApplication
public class FinTwinApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinTwinApplication.class, args);
        System.out.println("""
                \n
                ============================================================
                   FinTwin Backend is running!
                   API Base: http://localhost:8080/api
                   Auth:     http://localhost:8080/api/auth
                ============================================================
                """);
    }
}
