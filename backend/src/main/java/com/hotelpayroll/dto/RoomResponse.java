package com.hotelpayroll.dto;

import com.hotelpayroll.entity.RoomStatus;
import com.hotelpayroll.entity.RoomType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class RoomResponse {
    private Long id;
    private String roomNumber;
    private RoomType roomType;
    private String photoUrl;
    private String roomDescription;
    private Integer capacity;
    private BigDecimal normalPrice;
    private BigDecimal weekendPrice;
    private BigDecimal seasonalPrice;
    private RoomStatus roomStatus;
}
