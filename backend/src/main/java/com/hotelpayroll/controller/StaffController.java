package com.hotelpayroll.controller;

import com.hotelpayroll.dto.StaffRequest;
import com.hotelpayroll.dto.StaffResponse;
import com.hotelpayroll.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @PostMapping
    public StaffResponse create(@Valid @RequestBody StaffRequest request) {
        return staffService.create(request);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @PutMapping("/{id}")
    public StaffResponse update(@PathVariable Long id, @Valid @RequestBody StaffRequest request) {
        return staffService.update(id, request);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER','STAFF_MEMBER')")
    @GetMapping("/{id}")
    public StaffResponse getById(@PathVariable Long id) {
        return staffService.getById(id);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @GetMapping
    public Page<StaffResponse> getAll(@RequestParam(required = false) String name,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "10") int size) {
        return staffService.getAll(name, page, size);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @DeleteMapping("/{id}")
    public void softDelete(@PathVariable Long id) {
        staffService.softDelete(id);
    }
}
