package com.hotelpayroll.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "staff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String position;

    @Column(nullable = false)
    private BigDecimal basicSalary;

    @Column(nullable = false)
    private Integer attendance;

    @Column(nullable = false)
    private Double overtimeHours;

    @Column(nullable = false)
    private Integer absentDays;

    @Column(nullable = false)
    private BigDecimal overtimeRate;

    @Column(nullable = false)
    private BigDecimal dailyRate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StaffStatus status = StaffStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
