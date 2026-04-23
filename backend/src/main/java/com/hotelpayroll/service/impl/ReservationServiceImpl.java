package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.ReservationRequest;
import com.hotelpayroll.dto.ReservationResponse;
import com.hotelpayroll.entity.Reservation;
import com.hotelpayroll.entity.ReservationStatus;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.repository.ReservationRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final AuditService auditService;

    @Override
    public ReservationResponse create(ReservationRequest request, String createdByUsername) {
        Reservation reservation = Reservation.builder()
                .name(normalize(request.getName()))
                .email(normalize(request.getEmail()))
                .phone(normalize(request.getPhone()))
                .createdByUsername(createdByUsername)
                .reservationDate(request.getReservationDate())
                .mealType(request.getMealType())
                .guestCount(request.getGuestCount())
                .seatingPreference(request.getSeatingPreference())
                .specialRequests(normalizeNullable(request.getSpecialRequests()))
                .status(ReservationStatus.PENDING)
                .build();

        Reservation saved = reservationRepository.save(reservation);
        auditService.log("CREATE", "Reservation", saved.getId().toString(), "system", "Created table reservation");
        return mapToResponse(saved);
    }

    @Override
    public List<ReservationResponse> getAll() {
        return reservationRepository.findAllByOrderByReservationDateAscCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<ReservationResponse> getMine(String createdByUsername) {
        return reservationRepository.findAllByCreatedByUsernameOrderByReservationDateDescCreatedAtDesc(createdByUsername)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ReservationResponse updateStatus(Long id, ReservationStatus status) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        validateStatusTransition(reservation.getStatus(), status);
        reservation.setStatus(status);
        Reservation saved = reservationRepository.save(reservation);
        auditService.log("UPDATE", "Reservation", id.toString(), "system", "Updated reservation status to " + status);
        return mapToResponse(saved);
    }

    @Override
    public ReservationResponse assignTable(Long id, String assignedTable) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
        if (reservation.getStatus() == ReservationStatus.CANCELLED || reservation.getStatus() == ReservationStatus.COMPLETED) {
            throw new BadRequestException("Cannot assign a table to completed or cancelled reservations");
        }
        String normalizedTable = normalize(assignedTable);
        if (normalizedTable == null || normalizedTable.isBlank()) {
            throw new BadRequestException("Assigned table cannot be empty");
        }

        boolean tableAlreadyBooked = reservationRepository
                .existsByAssignedTableIgnoreCaseAndReservationDateAndMealTypeAndStatusInAndIdNot(
                        normalizedTable,
                        reservation.getReservationDate(),
                        reservation.getMealType(),
                        List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.SEATED),
                        reservation.getId()
                );
        if (tableAlreadyBooked) {
            throw new BadRequestException(
                    "Table " + normalizedTable + " is already reserved for "
                            + reservation.getReservationDate() + " (" + reservation.getMealType() + ")"
            );
        }

        reservation.setAssignedTable(normalizedTable);
        Reservation saved = reservationRepository.save(reservation);
        auditService.log("UPDATE", "Reservation", id.toString(), "system", "Assigned table " + assignedTable);
        return mapToResponse(saved);
    }

    @Override
    public ReservationResponse cancel(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
        if (reservation.getStatus() == ReservationStatus.COMPLETED) {
            throw new BadRequestException("Completed reservations cannot be cancelled");
        }
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new BadRequestException("Reservation is already cancelled");
        }
        return updateStatus(id, ReservationStatus.CANCELLED);
    }

    private void validateStatusTransition(ReservationStatus currentStatus, ReservationStatus nextStatus) {
        if (currentStatus == nextStatus) {
            throw new BadRequestException("Reservation is already in " + nextStatus + " status");
        }
        boolean validTransition = switch (currentStatus) {
            case PENDING -> nextStatus == ReservationStatus.CONFIRMED || nextStatus == ReservationStatus.CANCELLED;
            case CONFIRMED -> nextStatus == ReservationStatus.SEATED || nextStatus == ReservationStatus.CANCELLED;
            case SEATED -> nextStatus == ReservationStatus.COMPLETED || nextStatus == ReservationStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
        if (!validTransition) {
            throw new BadRequestException("Invalid status transition from " + currentStatus + " to " + nextStatus);
        }
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().replaceAll("\\s{2,}", " ");
    }

    private String normalizeNullable(String value) {
        String normalized = normalize(value);
        return (normalized == null || normalized.isBlank()) ? null : normalized;
    }

    private ReservationResponse mapToResponse(Reservation reservation) {
        return ReservationResponse.builder()
                .id(reservation.getId())
                .name(reservation.getName())
                .email(reservation.getEmail())
                .phone(reservation.getPhone())
                .createdByUsername(reservation.getCreatedByUsername())
                .reservationDate(reservation.getReservationDate())
                .mealType(reservation.getMealType())
                .guestCount(reservation.getGuestCount())
                .seatingPreference(reservation.getSeatingPreference())
                .specialRequests(reservation.getSpecialRequests())
                .assignedTable(reservation.getAssignedTable())
                .status(reservation.getStatus())
                .createdAt(reservation.getCreatedAt())
                .build();
    }
}
