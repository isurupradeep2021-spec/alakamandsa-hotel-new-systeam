package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.StaffRequest;
import com.hotelpayroll.dto.StaffResponse;
import com.hotelpayroll.entity.Staff;
import com.hotelpayroll.entity.StaffStatus;
import com.hotelpayroll.entity.User;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.repository.StaffRepository;
import com.hotelpayroll.repository.UserRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Override
    public StaffResponse create(StaffRequest request) {
        Staff staff = mapToEntity(new Staff(), request);
        Staff saved = staffRepository.save(staff);
        auditService.log("CREATE", "Staff", saved.getId().toString(), "system", "Created staff profile");
        return mapToResponse(saved);
    }

    @Override
    public StaffResponse update(Long id, StaffRequest request) {
        Staff staff = staffRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        staff = mapToEntity(staff, request);
        Staff saved = staffRepository.save(staff);
        auditService.log("UPDATE", "Staff", saved.getId().toString(), "system", "Updated staff profile");
        return mapToResponse(saved);
    }

    @Override
    public StaffResponse getById(Long id) {
        return staffRepository.findById(id).map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
    }

    @Override
    public Page<StaffResponse> getAll(String name, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<Staff> results = (name == null || name.isBlank())
                ? staffRepository.findByStatus(StaffStatus.ACTIVE, pageable)
                : staffRepository.findByNameContainingIgnoreCaseAndStatus(name, StaffStatus.ACTIVE, pageable);
        return results.map(this::mapToResponse);
    }

    @Override
    public void softDelete(Long id) {
        Staff staff = staffRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        staff.setStatus(StaffStatus.INACTIVE);
        staffRepository.save(staff);
        auditService.log("SOFT_DELETE", "Staff", staff.getId().toString(), "system", "Marked staff as INACTIVE");
    }

    private Staff mapToEntity(Staff staff, StaffRequest request) {
        staff.setName(request.getName());
        staff.setPosition(request.getPosition());
        staff.setBasicSalary(request.getBasicSalary());
        staff.setAttendance(request.getAttendance());
        staff.setOvertimeHours(request.getOvertimeHours());
        staff.setAbsentDays(request.getAbsentDays());
        staff.setOvertimeRate(request.getOvertimeRate());
        staff.setDailyRate(request.getDailyRate());

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Linked user not found"));
            staff.setUser(user);
        }

        return staff;
    }

    private StaffResponse mapToResponse(Staff staff) {
        return StaffResponse.builder()
                .id(staff.getId())
                .name(staff.getName())
                .position(staff.getPosition())
                .basicSalary(staff.getBasicSalary())
                .attendance(staff.getAttendance())
                .overtimeHours(staff.getOvertimeHours())
                .absentDays(staff.getAbsentDays())
                .overtimeRate(staff.getOvertimeRate())
                .dailyRate(staff.getDailyRate())
                .status(staff.getStatus())
                .build();
    }
}
