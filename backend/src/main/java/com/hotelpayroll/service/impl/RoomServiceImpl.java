package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.RoomRequest;
import com.hotelpayroll.dto.RoomResponse;
import com.hotelpayroll.entity.Room;
import com.hotelpayroll.entity.RoomBookingStatus;
import com.hotelpayroll.entity.RoomStatus;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.repository.RoomBookingRepository;
import com.hotelpayroll.repository.RoomRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final RoomBookingRepository roomBookingRepository;
    private final AuditService auditService;

    private static final List<RoomBookingStatus> ACTIVE_BOOKING_STATUSES = List.of(
            RoomBookingStatus.BOOKED,
            RoomBookingStatus.CHECKED_IN
    );

    @Override
    public RoomResponse create(RoomRequest request) {
        validateRoomNumber(request.getRoomNumber(), null);
        Room room = mapToEntity(new Room(), request);
        Room saved = roomRepository.save(room);
        auditService.log("CREATE", "Room", saved.getId().toString(), "system", "Created room record");
        LocalDate now = LocalDate.now();
        return mapToResponse(saved, now, now.plusDays(1));
    }

    @Override
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
        validateRoomNumber(request.getRoomNumber(), id);
        room = mapToEntity(room, request);
        Room saved = roomRepository.save(room);
        auditService.log("UPDATE", "Room", saved.getId().toString(), "system", "Updated room record");
        LocalDate now = LocalDate.now();
        return mapToResponse(saved, now, now.plusDays(1));
    }

    @Override
    public List<RoomResponse> getAll(LocalDate checkInDate, LocalDate checkOutDate) {
        if ((checkInDate == null) != (checkOutDate == null)) {
            throw new BadRequestException("Both check-in date and check-out date are required for availability filtering");
        }

        LocalDate availabilityCheckIn = checkInDate == null ? LocalDate.now() : checkInDate;
        LocalDate availabilityCheckOut = checkOutDate == null ? availabilityCheckIn.plusDays(1) : checkOutDate;

        if (!availabilityCheckOut.isAfter(availabilityCheckIn)) {
            throw new BadRequestException("Check-out date must be after check-in date");
        }

        return roomRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(room -> mapToResponse(room, availabilityCheckIn, availabilityCheckOut))
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
        room.setTotalRooms(request.getTotalRooms());
        room.setNormalPrice(request.getNormalPrice());
        room.setWeekendPrice(request.getWeekendPrice());
        room.setSeasonalPrice(request.getSeasonalPrice());
        room.setRoomStatus(request.getRoomStatus());
        return room;
    }

    private RoomResponse mapToResponse(Room room, LocalDate availabilityCheckIn, LocalDate availabilityCheckOut) {
        int totalRooms = room.getTotalRooms() == null ? 1 : room.getTotalRooms();
        Integer bookedRooms = roomBookingRepository.sumBookedRoomsByRoomNumber(
                room.getRoomNumber(),
                ACTIVE_BOOKING_STATUSES,
                availabilityCheckIn,
                availabilityCheckOut,
                null
        );
        int remainingRooms = Math.max(0, totalRooms - (bookedRooms == null ? 0 : bookedRooms));
        RoomStatus availabilityStatus = remainingRooms > 0 ? RoomStatus.AVAILABLE : RoomStatus.RESERVED;

        return RoomResponse.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .roomType(room.getRoomType())
                .photoUrl(room.getPhotoUrl())
                .roomDescription(room.getRoomDescription())
                .capacity(room.getCapacity())
                .totalRooms(totalRooms)
                .remainingRooms(remainingRooms)
                .normalPrice(room.getNormalPrice())
                .weekendPrice(room.getWeekendPrice())
                .seasonalPrice(room.getSeasonalPrice())
                .roomStatus(availabilityStatus)
                .build();
    }
}
