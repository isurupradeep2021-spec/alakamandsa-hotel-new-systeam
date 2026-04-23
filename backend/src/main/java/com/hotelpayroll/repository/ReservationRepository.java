package com.hotelpayroll.repository;

import com.hotelpayroll.entity.MealType;
import com.hotelpayroll.entity.Reservation;
import com.hotelpayroll.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDate;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findAllByOrderByReservationDateAscCreatedAtDesc();
    List<Reservation> findAllByCreatedByUsernameOrderByReservationDateDescCreatedAtDesc(String createdByUsername);
    boolean existsByEmail(String email);
    boolean existsByAssignedTableIgnoreCaseAndReservationDateAndMealTypeAndStatusInAndIdNot(
            String assignedTable,
            LocalDate reservationDate,
            MealType mealType,
            List<ReservationStatus> statuses,
            Long id
    );
}
