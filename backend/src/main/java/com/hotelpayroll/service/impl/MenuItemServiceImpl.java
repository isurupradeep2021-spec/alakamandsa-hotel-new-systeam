package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.MenuItemRequest;
import com.hotelpayroll.dto.MenuItemResponse;
import com.hotelpayroll.entity.CuisineType;
import com.hotelpayroll.entity.MenuItem;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.repository.MenuItemRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.MenuItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MenuItemServiceImpl implements MenuItemService {

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final MenuItemRepository menuItemRepository;
    private final AuditService auditService;
    @Value("${app.upload.menu-dir:uploads/menu-items}")
    private String uploadDir;

    @Override
    public MenuItemResponse create(MenuItemRequest request) {
        String normalizedName = normalize(request.getName());
        if (menuItemRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new BadRequestException("A menu item with this name already exists");
        }
        MenuItem menuItem = mapToEntity(new MenuItem(), request);
        MenuItem saved = menuItemRepository.save(menuItem);
        auditService.log("CREATE", "MenuItem", saved.getId().toString(), "system", "Created menu item");
        return mapToResponse(saved);
    }

    @Override
    public MenuItemResponse update(Long id, MenuItemRequest request) {
        String normalizedName = normalize(request.getName());
        if (menuItemRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new BadRequestException("A menu item with this name already exists");
        }
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        item = mapToEntity(item, request);
        MenuItem saved = menuItemRepository.save(item);
        auditService.log("UPDATE", "MenuItem", saved.getId().toString(), "system", "Updated menu item");
        return mapToResponse(saved);
    }

    @Override
    public MenuItemResponse updateAvailability(Long id, boolean available) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        item.setAvailable(available);
        MenuItem saved = menuItemRepository.save(item);
        auditService.log("UPDATE", "MenuItem", saved.getId().toString(), "system", "Updated menu item availability");
        return mapToResponse(saved);
    }

    @Override
    public MenuItemResponse uploadImage(Long id, MultipartFile file) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        validateImageFile(file);

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String extension = getFileExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + "." + extension;
            Path target = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            if (item.getImageFileName() != null && !item.getImageFileName().isBlank()) {
                Files.deleteIfExists(uploadPath.resolve(item.getImageFileName()));
            }

            item.setImageFileName(fileName);
            MenuItem saved = menuItemRepository.save(item);
            auditService.log("UPDATE", "MenuItem", saved.getId().toString(), "system", "Uploaded menu item image");
            return mapToResponse(saved);
        } catch (IOException ex) {
            throw new BadRequestException("Failed to upload image");
        }
    }

    @Override
    public List<MenuItemResponse> getAll(CuisineType cuisine, String search) {
        String safeSearch = search == null ? "" : search.trim();
        List<MenuItem> items;
        if (cuisine != null && !safeSearch.isBlank()) {
            items = menuItemRepository.findByCuisineAndNameContainingIgnoreCaseOrderByNameAsc(cuisine, safeSearch);
        } else if (cuisine != null) {
            items = menuItemRepository.findByCuisineOrderByNameAsc(cuisine);
        } else if (!safeSearch.isBlank()) {
            items = menuItemRepository.findByNameContainingIgnoreCaseOrderByNameAsc(safeSearch);
        } else {
            items = menuItemRepository.findAllByOrderByNameAsc();
        }
        return items.stream().map(this::mapToResponse).toList();
    }

    @Override
    public void delete(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        deleteImageIfExists(item.getImageFileName());
        menuItemRepository.delete(item);
        auditService.log("DELETE", "MenuItem", id.toString(), "system", "Deleted menu item");
    }

    private MenuItem mapToEntity(MenuItem item, MenuItemRequest request) {
        item.setName(normalize(request.getName()));
        item.setCuisine(request.getCuisine());
        item.setPrice(request.getPrice());
        item.setDescription(normalize(request.getDescription()));
        item.setBadge(normalizeNullable(request.getBadge()));
        item.setMealService(request.getMealService());
        item.setAvailable(request.getAvailable());
        return item;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().replaceAll("\\s{2,}", " ");
    }

    private String normalizeNullable(String value) {
        String normalized = normalize(value);
        return (normalized == null || normalized.isBlank()) ? null : normalized;
    }

    private MenuItemResponse mapToResponse(MenuItem item) {
        return MenuItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .cuisine(item.getCuisine())
                .price(item.getPrice())
                .description(item.getDescription())
                .badge(item.getBadge())
                .mealService(item.getMealService())
                .imageUrl(buildImageUrl(item.getImageFileName()))
                .available(item.getAvailable())
                .createdAt(item.getCreatedAt())
                .build();
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new BadRequestException("Image must be 5MB or smaller");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Only JPG, PNG, or WEBP images are allowed");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new BadRequestException("Invalid image file name");
        }
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        if (!Set.of("jpg", "jpeg", "png", "webp").contains(extension)) {
            throw new BadRequestException("Unsupported image extension");
        }
        return extension;
    }

    private String buildImageUrl(String imageFileName) {
        if (imageFileName == null || imageFileName.isBlank()) return null;
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/menu-items/images/")
                .path(imageFileName)
                .toUriString();
    }

    private void deleteImageIfExists(String imageFileName) {
        if (imageFileName == null || imageFileName.isBlank()) return;
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.deleteIfExists(uploadPath.resolve(imageFileName));
        } catch (IOException ignored) {
        }
    }
}
