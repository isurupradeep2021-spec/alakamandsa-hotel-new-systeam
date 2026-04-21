package com.hotelpayroll.service;

import com.hotelpayroll.dto.RoomRequest;
import com.hotelpayroll.dto.RoomResponse;

public interface RoomService {
    RoomResponse create(RoomRequest request);
}
