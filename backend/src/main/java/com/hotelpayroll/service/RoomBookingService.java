package com.hotelpayroll.service;

import com.hotelpayroll.dto.RoomBookingRequest;
import com.hotelpayroll.dto.RoomBookingResponse;

import java.util.List;

public interface RoomBookingService {
    RoomBookingResponse create(RoomBookingRequest request);
    RoomBookingResponse update(Long id, RoomBookingRequest request);
    List<RoomBookingResponse> getAll();
    void delete(Long id);
}
