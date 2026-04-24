package com.hotelpayroll.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name = "event_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "customer_mobile")
    private String customerMobile;

    @Column(name = "created_by_username")
    private String createdByUsername;

    private String eventType;

    private String hallName;

    private String packageName;

    @Column(columnDefinition = "DATETIME(0)")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime eventDateTime;

    @Column(name = "end_datetime", columnDefinition = "DATETIME(0)")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime endDateTime;

    @Column(name = "duration_hours")
    private Double durationHours;

    private Integer attendees;

    private BigDecimal pricePerGuest;

    @Column(name = "total_price")
    private BigDecimal totalPrice;

    private BigDecimal totalCost;

    private String notes;

    private String status;
}
