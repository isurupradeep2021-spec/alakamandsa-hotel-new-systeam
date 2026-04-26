package com.hotelpayroll.service;

import com.hotelpayroll.entity.EventBooking;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EventEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@hotelpayroll.local}")
    private String fromAddress;

    public void sendBookingConfirmation(EventBooking booking, byte[] pdfBytes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromAddress);
            helper.setTo(booking.getCustomerEmail());
            helper.setSubject("Event booking confirmation - Booking #" + booking.getId());
            helper.setText(buildConfirmationBody(booking));
            helper.addAttachment(buildPdfFileName(booking.getId()), new ByteArrayResource(pdfBytes));
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new IllegalStateException("Failed to send event booking confirmation email", exception);
        }
    }

    public void sendStatusUpdate(EventBooking booking) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(booking.getCustomerEmail());
            message.setSubject("Event booking status updated - " + booking.getStatus());
            message.setText(buildStatusUpdateBody(booking));
            mailSender.send(message);
        } catch (MailException exception) {
            throw new IllegalStateException("Failed to send event booking status email", exception);
        }
    }

    private String buildConfirmationBody(EventBooking booking) {
        return "Dear " + booking.getCustomerName() + ",\n\n"
                + "Your event booking has been received successfully.\n"
                + "Booking ID: " + booking.getId() + "\n"
                + "Status: " + booking.getStatus() + "\n"
                + "Hall: " + booking.getHallName() + "\n"
                + "Event Type: " + booking.getEventType() + "\n\n"
                + "Please find the booking confirmation PDF attached for your reference.\n\n"
                + "Thank you.";
    }

    private String buildStatusUpdateBody(EventBooking booking) {
        return "Dear " + booking.getCustomerName() + ",\n\n"
                + "Your event booking status has been updated to " + booking.getStatus() + ".\n"
                + "Booking ID: " + booking.getId() + "\n"
                + "Event Type: " + booking.getEventType() + "\n"
                + "Hall: " + booking.getHallName() + "\n\n"
                + "Please contact the hotel team if you need any further assistance.\n\n"
                + "Thank you.";
    }

    private String buildPdfFileName(Long bookingId) {
        return "event-booking-" + bookingId + ".pdf";
    }
}
