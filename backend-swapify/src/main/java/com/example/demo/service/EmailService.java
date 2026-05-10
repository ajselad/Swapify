package com.example.demo.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Generate a 6-digit verification code
     */
    public String generateVerificationCode() {
        int code = 100000 + secureRandom.nextInt(900000); // 100000 to 999999
        return String.valueOf(code);
    }

    /**
     * Send verification code for registration
     */
    public void sendVerificationCode(String to, String name, String code) {
        try {
            log.info("📧 Sending registration verification code to: {}", to);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Swapify - Verify Your Account");

            String emailBody = String.format(
                    "Hi %s,\n\n" +
                            "Welcome to Swapify!\n\n" +
                            "To complete your registration and activate your account, please use the following verification code:\n\n" +
                            "Verification Code: %s\n\n" +
                            "This code will expire in 10 minutes.\n\n" +
                            "If you didn't create an account with Swapify, please ignore this email.\n\n" +
                            "Best regards,\n" +
                            "The Swapify Team",
                    name, code
            );

            message.setText(emailBody);

            mailSender.send(message);
            log.info("✅ Registration verification email sent successfully to: {}", to);

        } catch (Exception e) {
            log.error("❌ Failed to send registration verification email to: {}", to, e);
            throw new RuntimeException("Failed to send verification email: " + e.getMessage(), e);
        }
    }

    /**
     * Send verification code for login
     */
    public void sendLoginVerificationCode(String to, String name, String code) {
        try {
            log.info("📧 Sending login verification code to: {}", to);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Swapify - Login Verification Code");

            String emailBody = String.format(
                    "Hi %s,\n\n" +
                            " Login Verification Required\n\n" +
                            "We detected a login attempt to your Swapify account. To complete your login, please use the following verification code:\n\n" +
                            "Verification Code: %s\n\n" +
                            " This code will expire in 5 minutes.\n\n" +
                            " For your security:\n" +
                            "   • This code is required for every login\n" +
                            "   • Don't share this code with anyone\n" +
                            "   • If you didn't attempt to log in, please secure your account\n\n" +
                            "If you didn't try to log in to Swapify, please ignore this email and consider changing your password.\n\n" +
                            "Stay secure,\n" +
                            "The Swapify Team 🛡\n\n" +
                            "---\n" +
                            "Swapify - Where Skills Meet Opportunity",
                    name, code
            );

            message.setText(emailBody);

            mailSender.send(message);
            log.info("✅ Login verification email sent successfully to: {}", to);

        } catch (Exception e) {
            log.error("❌ Failed to send login verification email to: {}", to, e);
            throw new RuntimeException("Failed to send login verification email: " + e.getMessage(), e);
        }
    }


    public void sendPasswordResetCode(String to, String name, String code) {
        try {
            log.info(" Sending password reset code to: {}", to);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(" Swapify - Reset Your Password");

            String emailBody = String.format(
                    "Hi %s,\n\n" +
                            " Password Reset Request\n\n" +
                            "We received a request to reset your Swapify password. Use the following 6-digit code to reset your password:\n\n" +
                            "Reset Code: %s\n\n" +
                            " This code will expire in 5 minutes.\n\n" +
                            " Security Tips:\n" +
                            "   • Don't share this code with anyone\n" +
                            "   • Only enter it on the official Swapify website\n" +
                            "   • Choose a strong, unique password\n\n" +
                            "If you didn't request this password reset, please ignore this email. Your account remains secure.\n\n" +
                            "Stay secure,\n" +
                            "The Swapify Team 🛡\n\n" +
                            "---\n" +
                            "Swapify - Where Skills Meet Opportunity",
                    name, code
            );

            message.setText(emailBody);

            mailSender.send(message);
            log.info("✅ Password reset code email sent successfully to: {}", to);

        } catch (Exception e) {
            log.error("❌ Failed to send password reset code email to: {}", to, e);
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage(), e);
        }
    }
    // Add these methods to your existing EmailService.java

    // Session Request Notification
    public void sendSessionRequestNotification(String teacherEmail, String teacherName,
                                               String studentName, String skillName, String sessionTitle) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(teacherEmail);
            helper.setSubject("New Session Request - " + skillName);
            helper.setFrom(fromEmail);

            String htmlContent = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">New Session Request</h2>
                    
                    <p>Hi %s,</p>
                    
                    <p>You have a new session request from <strong>%s</strong>:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin: 0 0 10px 0;">%s</h3>
                        <p style="margin: 5px 0;"><strong>Skill:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Student:</strong> %s</p>
                    </div>
                    
                    <p>Please log in to your account to accept or decline this request:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:5173/my-sessions" 
                           style="background-color: #007bff; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            Review Session Request
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Please respond within 48 hours to maintain a good response rate.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        This email was sent from Swapify. If you didn't expect this email, please contact support.
                    </p>
                </div>
            </div>
            """, teacherName, studentName, sessionTitle, skillName, studentName);

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Session request notification sent to: {}", teacherEmail);

        } catch (Exception e) {
            log.error("Failed to send session request notification to: {}", teacherEmail, e);
            throw new RuntimeException("Failed to send notification email");
        }
    }

    // Session Response Notification (when teacher accepts/declines)
    public void sendSessionResponseNotification(String studentEmail, String studentName,
                                                String teacherName, String skillName,
                                                String sessionTitle, String response, String message) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(studentEmail);
            helper.setSubject("Session " + response + " - " + skillName);
            helper.setFrom(fromEmail);

            String statusColor = response.equals("ACCEPTED") ? "#28a745" : "#dc3545";
            String statusText = response.equals("ACCEPTED") ? "accepted" : "declined";
            String actionText = response.equals("ACCEPTED") ?
                    "You can now coordinate scheduling with your teacher." :
                    "You can browse other teachers for this skill.";

            String htmlContent = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: %s; margin-bottom: 20px;">Session %s</h2>
                    
                    <p>Hi %s,</p>
                    
                    <p><strong>%s</strong> has %s your session request:</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin: 0 0 10px 0;">%s</h3>
                        <p style="margin: 5px 0;"><strong>Skill:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Teacher:</strong> %s</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: %s; font-weight: bold;">%s</span></p>
                    </div>
                    
                    %s
                    
                    <blockquote style="border-left: 4px solid %s; margin: 20px 0; padding-left: 20px; color: #666;">
                        "%s"
                    </blockquote>
                    
                    <p>%s</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:5173/my-sessions" 
                           style="background-color: #007bff; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            View My Sessions
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        This email was sent from Swapify.
                    </p>
                </div>
            </div>
            """, statusColor, statusText.toUpperCase(), studentName, teacherName, statusText,
                    sessionTitle, skillName, teacherName, statusColor, statusText.toUpperCase(),
                    (message != null && !message.trim().isEmpty()) ?
                            "<p><strong>" + teacherName + "</strong> included this message:</p>" : "",
                    statusColor, message != null ? message : "Thank you for your interest!",
                    actionText);

            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);

            log.info("Session response notification sent to: {}", studentEmail);

        } catch (Exception e) {
            log.error("Failed to send session response notification to: {}", studentEmail, e);
            throw new RuntimeException("Failed to send notification email");
        }
    }
}