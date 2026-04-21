package com.hotelpayroll.service;

import com.hotelpayroll.dto.RoomBookingRequest;
import com.hotelpayroll.dto.RoomBookingResponse;

public interface RoomBookingService {
    RoomBookingResponse create(RoomBookingRequest request);
}
