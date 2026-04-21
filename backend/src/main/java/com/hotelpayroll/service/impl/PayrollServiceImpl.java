package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.PayrollRequest;
import com.hotelpayroll.dto.PayrollResponse;
import com.hotelpayroll.entity.Payroll;
import com.hotelpayroll.entity.Staff;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.repository.PayrollRepository;
import com.hotelpayroll.repository.StaffRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.PayrollService;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollServiceImpl implements PayrollService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.10");

    private final PayrollRepository payrollRepository;
    private final StaffRepository staffRepository;
    private final AuditService auditService;

    @Override
    public PayrollResponse calculateAndSave(PayrollRequest request) {
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        BigDecimal overtimePay = BigDecimal.valueOf(staff.getOvertimeHours())
                .multiply(staff.getOvertimeRate())
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal absentDeduction = BigDecimal.valueOf(staff.getAbsentDays())
                .multiply(staff.getDailyRate())
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal taxableAmount = staff.getBasicSalary().add(overtimePay);
        BigDecimal tax = taxableAmount.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);

        BigDecimal deductions = absentDeduction.add(tax).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netSalary = staff.getBasicSalary().add(overtimePay).subtract(deductions).setScale(2, RoundingMode.HALF_UP);

        Payroll payroll = payrollRepository.findByStaffAndMonthAndYear(staff, request.getMonth(), request.getYear())
                .orElse(Payroll.builder().staff(staff).month(request.getMonth()).year(request.getYear()).build());

        payroll.setBasicSalary(staff.getBasicSalary());
        payroll.setOvertimePay(overtimePay);
        payroll.setDeductions(deductions);
        payroll.setNetSalary(netSalary);

        Payroll saved = payrollRepository.save(payroll);
        auditService.log("PAYROLL_CALCULATED", "Payroll", saved.getId().toString(), "system",
                "Auto calculated payroll for " + staff.getName());

        return toResponse(saved);
    }

    @Override
    public List<PayrollResponse> getAll() {
        return payrollRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<PayrollResponse> getByStaff(Long staffId) {
        return payrollRepository.findByStaffId(staffId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<PayrollResponse> getMyPayroll(String username) {
        Staff staff = staffRepository.findAll().stream()
                .filter(s -> s.getUser() != null && s.getUser().getUsername().equals(username))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Staff profile not linked to this account"));
        return getByStaff(staff.getId());
    }

    @Override
    public String exportCsv(Integer month, Integer year) {
        List<Payroll> payrolls = (month != null && year != null)
                ? payrollRepository.findByMonthAndYear(month, year)
                : payrollRepository.findAll();

        StringBuilder csv = new StringBuilder();
        csv.append("id,staffName,month,year,basicSalary,overtimePay,deductions,netSalary\n");
        for (Payroll payroll : payrolls) {
            csv.append(payroll.getId()).append(',')
                    .append(payroll.getStaff().getName()).append(',')
                    .append(payroll.getMonth()).append(',')
                    .append(payroll.getYear()).append(',')
                    .append(payroll.getBasicSalary()).append(',')
                    .append(payroll.getOvertimePay()).append(',')
                    .append(payroll.getDeductions()).append(',')
                    .append(payroll.getNetSalary()).append('\n');
        }
        return csv.toString();
    }

    @Override
    public byte[] exportPdf(Integer month, Integer year) {
        List<Payroll> payrolls = (month != null && year != null)
                ? payrollRepository.findByMonthAndYear(month, year)
                : payrollRepository.findAll();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            String title = (month != null && year != null)
                    ? "Payroll Report - " + year + "-" + String.format("%02d", month)
                    : "Payroll Report - All Records";
            document.add(new Paragraph(title, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            addHeader(table, "Staff");
            addHeader(table, "Month");
            addHeader(table, "Basic");
            addHeader(table, "Overtime");
            addHeader(table, "Deductions");
            addHeader(table, "Net");

            for (Payroll payroll : payrolls) {
                table.addCell(payroll.getStaff().getName());
                table.addCell(payroll.getYear() + "-" + String.format("%02d", payroll.getMonth()));
                table.addCell(payroll.getBasicSalary().toPlainString());
                table.addCell(payroll.getOvertimePay().toPlainString());
                table.addCell(payroll.getDeductions().toPlainString());
                table.addCell(payroll.getNetSalary().toPlainString());
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (DocumentException ex) {
            throw new IllegalStateException("Failed to generate PDF report", ex);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to export payroll PDF", ex);
        }
    }

    private void addHeader(PdfPTable table, String title) {
        PdfPCell cell = new PdfPCell(new Phrase(title));
        table.addCell(cell);
    }

    private PayrollResponse toResponse(Payroll payroll) {
        return PayrollResponse.builder()
                .id(payroll.getId())
                .staffId(payroll.getStaff().getId())
                .staffName(payroll.getStaff().getName())
                .basicSalary(payroll.getBasicSalary())
                .overtimePay(payroll.getOvertimePay())
                .deductions(payroll.getDeductions())
                .netSalary(payroll.getNetSalary())
                .month(payroll.getMonth())
                .year(payroll.getYear())
                .build();
    }
}
