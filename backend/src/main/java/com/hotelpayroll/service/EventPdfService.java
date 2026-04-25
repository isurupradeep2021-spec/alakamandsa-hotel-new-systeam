package com.hotelpayroll.service;

import com.hotelpayroll.entity.EventBooking;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EventPdfService {

    private static final String HOTEL_NAME = "Alakamanda Hotel";
    private static final String HOTEL_PHONE = "+(94) 777 258 1690";
    private static final String HOTEL_EMAIL = "alakamandahotel@gmail.com";

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("MMMM dd, yyyy  hh:mm a");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a");

    private static final Color DEEP_GREEN = new Color(24, 57, 46);
    private static final Color FOREST_GREEN = new Color(38, 93, 74);
    private static final Color SOFT_GREEN = new Color(236, 245, 240);
    private static final Color LIGHT_SAGE = new Color(245, 248, 246);
    private static final Color GOLD = new Color(191, 155, 48);
    private static final Color TEXT_DARK = new Color(30, 37, 34);
    private static final Color TEXT_MUTED = new Color(104, 115, 110);
    private static final Color BORDER = new Color(217, 225, 221);
    private static final Color WHITE = Color.WHITE;

    public byte[] generatePdf(EventBooking booking) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 24, 24, 20, 20);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            LocalDateTime issuedAt = LocalDateTime.now();

            document.add(buildHeader(booking, issuedAt));
            document.add(space(4f));
            document.add(buildGuestAndMetaSection(booking));
            document.add(space(4f));
            document.add(buildEventSpotlight(booking));
            document.add(space(4f));
            document.add(buildScheduleAndCostSection(booking));
            if (booking.getNotes() != null && !booking.getNotes().isBlank()) {
                document.add(space(4f));
                document.add(buildNotesSection(booking));
            }
            document.add(space(4f));
            document.add(buildFooter());

            document.close();
            return outputStream.toByteArray();
        } catch (DocumentException exception) {
            throw new IllegalStateException("Failed to generate event booking PDF", exception);
        } catch (Exception exception) {
            throw new IllegalStateException("Unexpected error while generating event booking PDF", exception);
        }
    }

    private PdfPTable buildHeader(EventBooking booking, LocalDateTime issuedAt) throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{3.2f, 1.3f});
        table.setWidthPercentage(100f);

        PdfPCell left = new PdfPCell();
        left.setBackgroundColor(DEEP_GREEN);
        left.setBorder(Rectangle.NO_BORDER);
        left.setPadding(14f);
        left.addElement(text("BOOKING CONFIRMATION", 9f, Font.BOLD, new Color(200, 220, 209), 4f));
        left.addElement(text(HOTEL_NAME, 19f, Font.BOLD, WHITE, 3f));
        left.addElement(text("Premium event booking invoice", 9.5f, Font.NORMAL, new Color(188, 209, 198), 8f));
        left.addElement(buildStatusBadge(booking.getStatus()));

        PdfPCell right = new PdfPCell();
        right.setBackgroundColor(FOREST_GREEN);
        right.setBorder(Rectangle.NO_BORDER);
        right.setPadding(14f);
        right.addElement(text("Reference", 8f, Font.BOLD, new Color(214, 229, 222), 3f));
        right.addElement(text("#BK-" + formatBookingNumber(booking.getId()), 13f, Font.BOLD, WHITE, 8f));
        right.addElement(text("Issued", 8f, Font.BOLD, new Color(214, 229, 222), 3f));
        right.addElement(text(formatDateTime(issuedAt), 9f, Font.NORMAL, WHITE, 8f));
        right.addElement(text("Status", 8f, Font.BOLD, new Color(214, 229, 222), 3f));
        right.addElement(text(normalizeStatus(booking.getStatus()), 10f, Font.NORMAL, WHITE, 0f));

        table.addCell(left);
        table.addCell(right);
        return table;
    }

    private PdfPTable buildGuestAndMetaSection(EventBooking booking) throws DocumentException {
        PdfPTable wrapper = new PdfPTable(new float[]{1.45f, 1f});
        wrapper.setWidthPercentage(100f);
        wrapper.setSpacingBefore(2f);

        PdfPCell guestCell = new PdfPCell();
        guestCell.setBackgroundColor(WHITE);
        guestCell.setBorderColor(BORDER);
        guestCell.setPadding(10f);
        guestCell.addElement(sectionTitle("Guest Details"));
        guestCell.addElement(infoLine("Customer Name", safe(booking.getCustomerName())));
        guestCell.addElement(infoLine("Customer Email", safe(booking.getCustomerEmail())));
        guestCell.addElement(infoLine("Customer Mobile", safe(booking.getCustomerMobile())));

        PdfPCell metaCell = new PdfPCell();
        metaCell.setBackgroundColor(LIGHT_SAGE);
        metaCell.setBorderColor(BORDER);
        metaCell.setPadding(10f);
        metaCell.addElement(sectionTitle("Booking Overview"));
        metaCell.addElement(infoLine("Booking ID", valueOf(booking.getId())));
        metaCell.addElement(infoLine("Package", safe(booking.getPackageName())));
        metaCell.addElement(infoLine("Attendees", valueOf(booking.getAttendees())));
        metaCell.addElement(infoLine("Duration", formatHours(booking.getDurationHours())));

        wrapper.addCell(guestCell);
        wrapper.addCell(metaCell);
        return wrapper;
    }

    private PdfPTable buildEventSpotlight(EventBooking booking) throws DocumentException {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100f);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(SOFT_GREEN);
        cell.setBorderColor(new Color(201, 222, 210));
        cell.setPadding(11f);
        cell.addElement(text("EVENT HIGHLIGHT", 8.5f, Font.BOLD, FOREST_GREEN, 6f));
        cell.addElement(text(safe(booking.getEventType()) + " at " + safe(booking.getHallName()), 15f, Font.BOLD, DEEP_GREEN, 4f));
        cell.addElement(text(
                "Scheduled for " + formatDate(booking.getEventDateTime()) + " from " + formatTime(booking.getEventDateTime()) + " to " + formatTime(booking.getEndDateTime()),
                9f,
                Font.NORMAL,
                TEXT_MUTED,
                8f
        ));

        PdfPTable chips = new PdfPTable(new float[]{1f, 1f, 1f});
        chips.setWidthPercentage(100f);
        chips.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        chips.addCell(chipCell("Hall", safe(booking.getHallName())));
        chips.addCell(chipCell("Event Type", safe(booking.getEventType())));
        chips.addCell(chipCell("Package", safe(booking.getPackageName())));
        cell.addElement(chips);

        table.addCell(cell);
        return table;
    }

    private PdfPTable buildScheduleAndCostSection(EventBooking booking) throws DocumentException {
        PdfPTable wrapper = new PdfPTable(new float[]{1.1f, 1f});
        wrapper.setWidthPercentage(100f);

        PdfPCell scheduleCell = new PdfPCell();
        scheduleCell.setBackgroundColor(WHITE);
        scheduleCell.setBorderColor(BORDER);
        scheduleCell.setPadding(10f);
        scheduleCell.addElement(sectionTitle("Schedule"));
        scheduleCell.addElement(infoLine("Event Date", formatDate(booking.getEventDateTime())));
        scheduleCell.addElement(infoLine("Start Time", formatTime(booking.getEventDateTime())));
        scheduleCell.addElement(infoLine("End Time", formatTime(booking.getEndDateTime())));
        scheduleCell.addElement(infoLine("Duration Hours", formatHours(booking.getDurationHours())));

        PdfPCell costCell = new PdfPCell();
        costCell.setBackgroundColor(WHITE);
        costCell.setBorderColor(BORDER);
        costCell.setPadding(10f);
        costCell.addElement(sectionTitle("Invoice Summary"));

        BigDecimal hourlyRate = safeMoney(booking.getPricePerGuest());
        BigDecimal durationHours = booking.getDurationHours() == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(booking.getDurationHours());
        BigDecimal hallCharges = hourlyRate.multiply(durationHours).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalCost = resolveTotalCost(booking);
        BigDecimal additionalCharges = totalCost.subtract(hallCharges).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        costCell.addElement(costLine("Hall charges (" + formatMoney(hourlyRate) + " x " + formatHours(booking.getDurationHours()) + ")", formatMoney(hallCharges), false));
        costCell.addElement(costLine("Package / additional charges", formatMoney(additionalCharges), false));
        costCell.addElement(costLine("Confirmation status", normalizeStatus(booking.getStatus()), false));
        costCell.addElement(costLine("Total amount", formatMoney(totalCost), true));

        wrapper.addCell(scheduleCell);
        wrapper.addCell(costCell);
        return wrapper;
    }

    private PdfPTable buildNotesSection(EventBooking booking) throws DocumentException {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100f);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new Color(252, 251, 247));
        cell.setBorderColor(BORDER);
        cell.setPadding(10f);
        cell.addElement(sectionTitle("Special Notes"));
        cell.addElement(text(booking.getNotes().trim(), 9f, Font.NORMAL, TEXT_MUTED, 0f));
        table.addCell(cell);
        return table;
    }

    private PdfPTable buildFooter() throws DocumentException {
        PdfPTable table = new PdfPTable(new float[]{2.2f, 1f});
        table.setWidthPercentage(100f);

        PdfPCell left = new PdfPCell();
        left.setBackgroundColor(DEEP_GREEN);
        left.setBorder(Rectangle.NO_BORDER);
        left.setPadding(9f);
        left.addElement(text("Any enquiries?", 8.5f, Font.BOLD, new Color(197, 219, 207), 4f));
        left.addElement(text(HOTEL_PHONE, 9f, Font.NORMAL, WHITE, 2f));
        left.addElement(text(HOTEL_EMAIL, 9f, Font.NORMAL, WHITE, 0f));

        PdfPCell right = new PdfPCell();
        right.setBackgroundColor(DEEP_GREEN);
        right.setBorder(Rectangle.NO_BORDER);
        right.setPadding(9f);
        Paragraph thanks = text("Thank you for choosing " + HOTEL_NAME, 9f, Font.BOLD, WHITE, 3f);
        thanks.setAlignment(Element.ALIGN_RIGHT);
        right.addElement(thanks);
        Paragraph receipt = text("Please keep this PDF as your confirmation receipt.", 8f, Font.NORMAL, new Color(197, 219, 207), 0f);
        receipt.setAlignment(Element.ALIGN_RIGHT);
        right.addElement(receipt);

        table.addCell(left);
        table.addCell(right);
        return table;
    }

    private PdfPTable buildStatusBadge(String status) throws DocumentException {
        PdfPTable badge = new PdfPTable(new float[]{0.18f, 1f});
        badge.setWidthPercentage(44f);

        PdfPCell dot = new PdfPCell();
        dot.setBackgroundColor(GOLD);
        dot.setBorder(Rectangle.NO_BORDER);
        dot.setFixedHeight(14f);

        PdfPCell textCell = new PdfPCell(new Phrase(" " + normalizeStatus(status), font(8.5f, Font.BOLD, WHITE)));
        textCell.setBackgroundColor(new Color(255, 255, 255, 26));
        textCell.setBorder(Rectangle.NO_BORDER);
        textCell.setPaddingTop(1f);
        textCell.setPaddingBottom(2f);
        textCell.setPaddingLeft(6f);

        badge.addCell(dot);
        badge.addCell(textCell);
        return badge;
    }

    private PdfPCell chipCell(String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(WHITE);
        cell.setBorderColor(new Color(206, 224, 215));
        cell.setPadding(6f);
        cell.addElement(text(label, 7.5f, Font.BOLD, TEXT_MUTED, 3f));
        cell.addElement(text(value, 9.5f, Font.BOLD, DEEP_GREEN, 0f));
        return cell;
    }

    private Paragraph sectionTitle(String title) {
        return text(title.toUpperCase(), 8.5f, Font.BOLD, FOREST_GREEN, 6f);
    }

    private Paragraph infoLine(String label, String value) {
        Paragraph paragraph = new Paragraph();
        paragraph.setSpacingAfter(4f);
        paragraph.add(new Phrase(label + ": ", font(9f, Font.BOLD, TEXT_DARK)));
        paragraph.add(new Phrase(value, font(9f, Font.NORMAL, TEXT_MUTED)));
        return paragraph;
    }

    private Paragraph costLine(String label, String value, boolean total) {
        Paragraph paragraph = new Paragraph();
        paragraph.setSpacingAfter(total ? 0f : 4f);
        paragraph.add(new Phrase(label + ": ", font(total ? 10.5f : 9f, total ? Font.BOLD : Font.NORMAL, total ? TEXT_DARK : TEXT_MUTED)));
        paragraph.add(new Phrase(value, font(total ? 11.5f : 9f, Font.BOLD, total ? DEEP_GREEN : TEXT_DARK)));
        return paragraph;
    }

    private Paragraph text(String value, float size, int style, Color color, float spacingAfter) {
        Paragraph paragraph = new Paragraph(safe(value), font(size, style, color));
        paragraph.setSpacingAfter(spacingAfter);
        return paragraph;
    }

    private Paragraph space(float spacingAfter) {
        Paragraph paragraph = new Paragraph(" ");
        paragraph.setSpacingAfter(spacingAfter);
        return paragraph;
    }

    private Font font(float size, int style, Color color) {
        return FontFactory.getFont(FontFactory.HELVETICA, size, style, color);
    }

    private String formatBookingNumber(Long id) {
        return id == null ? "0000" : String.format("%04d", id);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "Confirmed";
        }
        String normalized = status.trim().toLowerCase();
        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }

    private String formatDate(LocalDateTime value) {
        return value == null ? "-" : value.format(DATE_FORMATTER);
    }

    private String formatTime(LocalDateTime value) {
        return value == null ? "-" : value.format(TIME_FORMATTER);
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "-" : value.format(DATE_TIME_FORMATTER);
    }

    private String formatHours(Double value) {
        if (value == null) {
            return "-";
        }
        BigDecimal normalized = BigDecimal.valueOf(value).stripTrailingZeros();
        return normalized.toPlainString() + " hrs";
    }

    private String formatMoney(BigDecimal value) {
        return "Rs. " + safeMoney(value).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal resolveTotalCost(EventBooking booking) {
        BigDecimal value = booking.getTotalCost() != null ? booking.getTotalCost() : booking.getTotalPrice();
        return safeMoney(value).setScale(2, RoundingMode.HALF_UP);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value.trim();
    }

    private String valueOf(Object value) {
        return value == null ? "-" : String.valueOf(value);
    }
}
