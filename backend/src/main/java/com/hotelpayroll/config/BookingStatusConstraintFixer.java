package com.hotelpayroll.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingStatusConstraintFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // Only run for SQL Server
        try {
            if (!jdbcTemplate.getDataSource().getConnection().getMetaData().getDatabaseProductName().equals("Microsoft SQL Server")) {
                return;
            }
        } catch (Exception e) {
            log.warn("Could not check database type: {}", e.getMessage());
            return;
        }
        // SQL Server keeps old enum CHECK constraints after enum changes.
        // Recreate booking_status CHECK constraint with the current enum values.
        String dropExistingConstraintSql = """
                DECLARE @sql NVARCHAR(MAX) = N'';
                SELECT @sql = @sql + N'ALTER TABLE dbo.room_bookings DROP CONSTRAINT [' + cc.name + N'];'
                FROM sys.check_constraints cc
                WHERE cc.parent_object_id = OBJECT_ID(N'dbo.room_bookings')
                  AND (
                      cc.name LIKE N'CK__room_book__booki__%'
                      OR cc.name = N'CK_room_bookings_booking_status'
                      OR LOWER(cc.definition) LIKE N'%booking_status%'
                  );

                IF (@sql <> N'')
                    EXEC sp_executesql @sql;
                """;

        String addConstraintSql = """
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.check_constraints
                    WHERE parent_object_id = OBJECT_ID(N'dbo.room_bookings')
                      AND name = N'CK_room_bookings_booking_status'
                )
                BEGIN
                    ALTER TABLE dbo.room_bookings
                    WITH CHECK ADD CONSTRAINT CK_room_bookings_booking_status
                    CHECK (booking_status IN (
                        'BOOKED',
                        'CHECKED_IN',
                        'CANCELLATION_REQUESTED',
                        'CHECKED_OUT',
                        'CANCELLED'
                    ));
                END
                """;

        try {
            jdbcTemplate.execute(dropExistingConstraintSql);
            jdbcTemplate.execute(addConstraintSql);
        } catch (Exception ex) {
            log.warn("Could not reconcile room_bookings booking_status constraint: {}", ex.getMessage());
        }
    }
}
