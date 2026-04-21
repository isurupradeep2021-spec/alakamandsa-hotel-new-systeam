package com.hotelpayroll.controller;

import com.hotelpayroll.dto.PayrollRequest;
import com.hotelpayroll.dto.PayrollResponse;
import com.hotelpayroll.service.PayrollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @PostMapping("/calculate")
    public PayrollResponse calculate(@Valid @RequestBody PayrollRequest request) {
        return payrollService.calculateAndSave(request);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @GetMapping
    public List<PayrollResponse> getAll() {
        return payrollService.getAll();
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @GetMapping("/staff/{staffId}")
    public List<PayrollResponse> getByStaff(@PathVariable Long staffId) {
        return payrollService.getByStaff(staffId);
    }

    @PreAuthorize("hasRole('STAFF_MEMBER')")
    @GetMapping("/my")
    public List<PayrollResponse> myPayroll(Authentication authentication) {
        return payrollService.getMyPayroll(authentication.getName());
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(@RequestParam(required = false) Integer month,
                                            @RequestParam(required = false) Integer year) {
        String csv = payrollService.exportCsv(month, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payroll-report.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(csv);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@RequestParam(required = false) Integer month,
                                            @RequestParam(required = false) Integer year) {
        byte[] pdf = payrollService.exportPdf(month, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payroll-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
