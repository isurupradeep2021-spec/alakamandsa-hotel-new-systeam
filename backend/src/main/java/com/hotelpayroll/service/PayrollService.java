package com.hotelpayroll.service;

import com.hotelpayroll.dto.PayrollRequest;
import com.hotelpayroll.dto.PayrollResponse;

import java.util.List;

public interface PayrollService {
    PayrollResponse calculateAndSave(PayrollRequest request);
    List<PayrollResponse> getAll();
    List<PayrollResponse> getByStaff(Long staffId);
    List<PayrollResponse> getMyPayroll(String username);
    String exportCsv(Integer month, Integer year);
    byte[] exportPdf(Integer month, Integer year);
}
