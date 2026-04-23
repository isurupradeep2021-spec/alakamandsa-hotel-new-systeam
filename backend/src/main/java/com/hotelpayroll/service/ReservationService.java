package com.hotelpayroll.service;

import com.hotelpayroll.dto.ReservationRequest;
import com.hotelpayroll.dto.ReservationResponse;
import com.hotelpayroll.entity.ReservationStatus;

import java.util.List;

public interface ReservationService {
    ReservationResponse create(ReservationRequest request, String createdByUsername);
    List<ReservationResponse> getAll();
    List<ReservationResponse> getMine(String createdByUsername);
    ReservationResponse updateStatus(Long id, ReservationStatus status);
    ReservationResponse assignTable(Long id, String assignedTable);
    ReservationResponse cancel(Long id);
}
