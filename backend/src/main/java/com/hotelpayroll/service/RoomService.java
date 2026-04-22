package com.hotelpayroll.service;

import com.hotelpayroll.dto.RoomRequest;
import com.hotelpayroll.dto.RoomResponse;

import java.util.List;

public interface RoomService {
    RoomResponse create(RoomRequest request);
    RoomResponse update(Long id, RoomRequest request);
    List<RoomResponse> getAll();
    void delete(Long id);
}
