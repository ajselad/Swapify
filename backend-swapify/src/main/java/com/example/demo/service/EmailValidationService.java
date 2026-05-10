package com.example.demo.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.regex.Pattern;

@Service
@Slf4j
public class EmailValidationService {

    // Common fake/disposable email domains to block
    private static final Set<String> BLOCKED_DOMAINS = Set.of(
            "10minutemail.com", "guerrillamail.com", "mailinator.com", "tempmail.org",
            "temp-mail.org", "throwaway.email", "getnada.com", "maildrop.cc",
            "sharklasers.com", "yopmail.com", "mohmal.com", "fakeinbox.com",
            "dispostable.com", "tempail.com", "spamgourmet.com", "mailnesia.com",
            "fake.fake", "nonexistent.xyz", "nowhere.com", "invalid.test"
    );

    // Valid email pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    // Common domains that should always be allowed
    private static final Set<String> TRUSTED_DOMAINS = Set.of(
            "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
            "protonmail.com", "aol.com", "live.com", "msn.com", "ymail.com",
            "mail.com", "zoho.com", "fastmail.com", "tutanota.com"
    );

    public boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        email = email.trim().toLowerCase();
        // Check basic format
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            log.warn("Invalid email format: {}", email);
            return false;
        }

        // Extract domain
        String domain = email.substring(email.lastIndexOf('@') + 1);

        // Check if domain is blocked
        if (BLOCKED_DOMAINS.contains(domain)) {
            log.warn("Blocked disposable email domain: {}", domain);
            return false;
        }

        // Check for obviously fake patterns
        if (isSuspiciousDomain(domain)) {
            log.warn("Suspicious email domain detected: {}", domain);
            return false;
        }

        // If it's a trusted domain, allow it
        if (TRUSTED_DOMAINS.contains(domain)) {
            return true;
        }

        // For other domains, do basic validation
        return isValidDomain(domain);
    }

    private boolean isSuspiciousDomain(String domain) {
        // Check for suspicious patterns
        return domain.contains("fake") ||
                domain.contains("test") ||
                domain.contains("temp") ||
                domain.contains("disposable") ||
                domain.contains("spam") ||
                domain.contains("trash") ||
                domain.endsWith(".test") ||
                domain.endsWith(".fake") ||
                domain.endsWith(".invalid") ||
                domain.length() < 4 ||  // Very short domains are suspicious
                !domain.contains(".");  // Must have at least one dot
    }

    private boolean isValidDomain(String domain) {
        // Basic domain validation
        if (domain.length() < 4 || domain.length() > 253) {
            return false;
        }

        // Check if domain has valid format
        Pattern domainPattern = Pattern.compile("^[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
        if (!domainPattern.matcher(domain).matches()) {
            return false;
        }

        // Check for consecutive dots or hyphens
        if (domain.contains("..") || domain.contains("--")) {
            return false;
        }

        // Domain can't start or end with dot or hyphen
        if (domain.startsWith(".") || domain.endsWith(".") ||
                domain.startsWith("-") || domain.endsWith("-")) {
            return false;
        }

        return true;
    }

    public String getEmailValidationError(String email) {
        if (email == null || email.trim().isEmpty()) {
            return "Email is required";
        }

        email = email.trim().toLowerCase();

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            return "Please enter a valid email address";
        }

        String domain = email.substring(email.lastIndexOf('@') + 1);

        if (BLOCKED_DOMAINS.contains(domain)) {
            return "Disposable email addresses are not allowed. Please use a valid email address";
        }

        if (isSuspiciousDomain(domain)) {
            return "This email domain appears to be invalid. Please use a valid email address";
        }

        if (!isValidDomain(domain)) {
            return "Please enter a valid email address with a real domain";
        }

        return null; // Email is valid
    }
}