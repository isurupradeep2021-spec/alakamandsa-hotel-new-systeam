package com.hotelpayroll.security;

import com.hotelpayroll.entity.Permission;
import com.hotelpayroll.entity.Role;

import java.util.EnumSet;
import java.util.Set;

public final class RolePermissions {

    private RolePermissions() {
    }

    public static Set<Permission> forRole(Role role) {
        return switch (role) {
            case SUPER_ADMIN, MANAGER -> EnumSet.allOf(Permission.class);
            case RESTAURANT_MANAGER -> EnumSet.of(
                    Permission.VIEW_ORDERS,
                    Permission.UPDATE_ORDER_STATUS,
                    Permission.VIEW_RESERVATIONS,
                    Permission.UPDATE_RESERVATION_STATUS,
                    Permission.ASSIGN_TABLES,
                    Permission.MANAGE_TABLES,
                    Permission.VIEW_MENU,
                    Permission.VIEW_REPORTS,
                    Permission.VIEW_LIVE_DINING
            );
            case CUSTOMER -> EnumSet.of(Permission.VIEW_MENU, Permission.CREATE_RESERVATIONS, Permission.VIEW_LIVE_DINING);
            case STAFF_MEMBER, EVENT_MANAGER -> EnumSet.noneOf(Permission.class);
        };
    }
}
