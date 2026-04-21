package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.DashboardResponse;
import com.hotelpayroll.entity.StaffStatus;
import com.hotelpayroll.repository.PayrollRepository;
import com.hotelpayroll.repository.StaffRepository;
import com.hotelpayroll.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final StaffRepository staffRepository;
    private final PayrollRepository payrollRepository;

    @Override
    public DashboardResponse getSummary() {
        long totalStaff = staffRepository.findAll().stream().filter(s -> s.getStatus() == StaffStatus.ACTIVE).count();
        long totalPayrollRecords = payrollRepository.count();
        BigDecimal totalSalaryPaid = payrollRepository.findAll().stream()
                .map(p -> p.getNetSalary() == null ? BigDecimal.ZERO : p.getNetSalary())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return DashboardResponse.builder()
                .totalStaff(totalStaff)
                .totalPayrollRecords(totalPayrollRecords)
                .totalSalaryPaid(totalSalaryPaid)
                .build();
    }
}
