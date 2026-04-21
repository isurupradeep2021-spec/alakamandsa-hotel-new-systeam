package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.RoomRequest;
import com.hotelpayroll.dto.RoomResponse;
import com.hotelpayroll.entity.Room;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.repository.RoomRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final AuditService auditService;

    @Override
    public RoomResponse create(RoomRequest request) {
        roomRepository.findByRoomNumberIgnoreCase(request.getRoomNumber().trim())
                .ifPresent(room -> {
                    throw new BadRequestException("Room number already exists");
                });

        Room room = Room.builder()
                .roomNumber(request.getRoomNumber().trim())
                .roomType(request.getRoomType())
                .photoUrl(request.getPhotoUrl().trim())
                .roomDescription(request.getRoomDescription().trim())
                .capacity(request.getCapacity())
                .normalPrice(request.getNormalPrice())
                .weekendPrice(request.getWeekendPrice())
                .seasonalPrice(request.getSeasonalPrice())
                .roomStatus(request.getRoomStatus())
                .build();

        Room saved = roomRepository.save(room);
        auditService.log("CREATE", "Room", saved.getId().toString(), "system", "Created room record");
        return mapToResponse(saved);
    }

    private RoomResponse mapToResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .roomType(room.getRoomType())
                .photoUrl(room.getPhotoUrl())
                .roomDescription(room.getRoomDescription())
                .capacity(room.getCapacity())
                .normalPrice(room.getNormalPrice())
                .weekendPrice(room.getWeekendPrice())
                .seasonalPrice(room.getSeasonalPrice())
                .roomStatus(room.getRoomStatus())
                .build();
    }
}
