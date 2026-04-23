package com.hotelpayroll.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String roomNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomType roomType;

    @Column(nullable = false)
    private String photoUrl;

    @Column(nullable = false, length = 1000)
    private String roomDescription;

    @Column(nullable = false)
    private Integer capacity;

    @Column
    @Builder.Default
    private Integer totalRooms = 1;

    @Column(nullable = false)
    private BigDecimal normalPrice;

    @Column(nullable = false)
    private BigDecimal weekendPrice;

    private BigDecimal seasonalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomStatus roomStatus;
}
