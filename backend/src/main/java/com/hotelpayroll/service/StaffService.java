package com.hotelpayroll.service;

import com.hotelpayroll.dto.StaffRequest;
import com.hotelpayroll.dto.StaffResponse;
import org.springframework.data.domain.Page;

public interface StaffService {
    StaffResponse create(StaffRequest request);
    StaffResponse update(Long id, StaffRequest request);
    StaffResponse getById(Long id);
    Page<StaffResponse> getAll(String name, int page, int size);
    void softDelete(Long id);
}
