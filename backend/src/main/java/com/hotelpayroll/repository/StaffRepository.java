package com.hotelpayroll.repository;

import com.hotelpayroll.entity.Staff;
import com.hotelpayroll.entity.StaffStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    Page<Staff> findByStatus(StaffStatus status, Pageable pageable);
    Page<Staff> findByNameContainingIgnoreCaseAndStatus(String name, StaffStatus status, Pageable pageable);
}
