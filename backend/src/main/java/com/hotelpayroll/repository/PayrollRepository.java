package com.hotelpayroll.repository;

import com.hotelpayroll.entity.Payroll;
import com.hotelpayroll.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    Optional<Payroll> findByStaffAndMonthAndYear(Staff staff, Integer month, Integer year);
    List<Payroll> findByStaffId(Long staffId);
    List<Payroll> findByMonthAndYear(Integer month, Integer year);
}
