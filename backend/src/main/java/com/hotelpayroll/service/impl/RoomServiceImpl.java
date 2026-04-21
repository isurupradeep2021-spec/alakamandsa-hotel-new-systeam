package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.RoomRequest;
import com.hotelpayroll.dto.RoomResponse;
import com.hotelpayroll.entity.Room;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.repository.RoomRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final AuditService auditService;

    @Override
    public RoomResponse create(RoomRequest request) {
        validateRoomNumber(request.getRoomNumber(), null);
        Room room = mapToEntity(new Room(), request);
        Room saved = roomRepository.save(room);
        auditService.log("CREATE", "Room", saved.getId().toString(), "system", "Created room record");
        return mapToResponse(saved);
    }

    @Override
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        validateRoomNumber(request.getRoomNumber(), id);
        room = mapToEntity(room, request);
        Room saved = roomRepository.save(room);
        auditService.log("UPDATE", "Room", saved.getId().toString(), "system", "Updated room record");
        return mapToResponse(saved);
    }

    @Override
    public List<RoomResponse> getAll() {
        return roomRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void delete(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        roomRepository.delete(room);
        auditService.log("DELETE", "Room", id.toString(), "system", "Deleted room record");
    }

    private void validateRoomNumber(String roomNumber, Long currentId) {
        roomRepository.findByRoomNumberIgnoreCase(roomNumber.trim()).ifPresent(room -> {
            if (currentId == null || !room.getId().equals(currentId)) {
                throw new BadRequestException("Room number already exists");
            }
        });
    }

    private Room mapToEntity(Room room, RoomRequest request) {
        room.setRoomNumber(request.getRoomNumber().trim());
        room.setRoomType(request.getRoomType());
        room.setPhotoUrl(request.getPhotoUrl().trim());
        room.setRoomDescription(request.getRoomDescription().trim());
        room.setCapacity(request.getCapacity());
        room.setNormalPrice(request.getNormalPrice());
        room.setWeekendPrice(request.getWeekendPrice());
        room.setSeasonalPrice(request.getSeasonalPrice());
        room.setRoomStatus(request.getRoomStatus());
        return room;
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
