package com.hotelpayroll.service.impl;

import com.hotelpayroll.entity.AuditLog;
import com.hotelpayroll.repository.AuditLogRepository;
import com.hotelpayroll.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    @Override
    public void log(String action, String entityName, String entityId, String performedBy, String details) {
        AuditLog log = AuditLog.builder()
                .action(action)
                .entityName(entityName)
                .entityId(entityId)
                .performedBy(performedBy)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }
}
