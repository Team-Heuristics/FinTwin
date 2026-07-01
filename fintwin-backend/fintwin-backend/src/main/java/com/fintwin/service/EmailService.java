package com.fintwin.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Handles outbound email delivery for FinTwin reports.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String username;
    private final String password;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from:}") String fromAddress,
                        @Value("${spring.mail.username:}") String username,
                        @Value("${spring.mail.password:}") String password) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.username = username;
        this.password = password;
    }

    public void sendReportEmail(String recipient, String subject, String body) {
        if (!StringUtils.hasText(recipient)) {
            throw new IllegalArgumentException("Recipient email is required");
        }

        validateMailConfiguration();

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(body, false);

            mailSender.send(mimeMessage);
            logger.info("Financial report email sent to {}", recipient);
        } catch (MailException | MessagingException ex) {
            logger.error("Failed to send financial report email to {}", recipient, ex);
            throw new IllegalStateException(
                    "Unable to send financial report email. Verify SMTP host, username, password, and sender address.",
                    ex
            );
        }
    }

    private void validateMailConfiguration() {
        if (!StringUtils.hasText(fromAddress) || !StringUtils.hasText(username) || !StringUtils.hasText(password)) {
            throw new IllegalStateException(
                    "Email delivery is not configured on the server. Set MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM before sending reports."
            );
        }

        if (looksLikePlaceholder(fromAddress) || looksLikePlaceholder(username) || looksLikePlaceholder(password)) {
            throw new IllegalStateException(
                    "Email delivery is still using placeholder SMTP values. Replace them with real SMTP credentials before sending reports."
            );
        }
    }

    private boolean looksLikePlaceholder(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase();
        return normalized.isEmpty()
                || normalized.contains("your_email")
                || normalized.contains("example.com")
                || normalized.contains("your_app_password")
                || normalized.contains("changeme");
    }
}
