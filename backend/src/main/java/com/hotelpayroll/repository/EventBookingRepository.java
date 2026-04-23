package com.hotelpayroll.repository;

import com.hotelpayroll.entity.EventBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventBookingRepository extends JpaRepository<EventBooking, Long> {
    List<EventBooking> findAllByOrderByEventDateTimeDesc();
    List<EventBooking> findByHallNameIgnoreCase(String hallName);
    List<EventBooking> findByHallNameIgnoreCaseAndIdNot(String hallName, Long id);
    List<EventBooking> findByCreatedByUsernameOrderByEventDateTimeDesc(String createdByUsername);
}
