package com.hotelpayroll.service;

public interface AuditService {
    void log(String action, String entityName, String entityId, String performedBy, String details);
}
