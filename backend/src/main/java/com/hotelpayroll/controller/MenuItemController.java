package com.hotelpayroll.controller;

import com.hotelpayroll.dto.MenuItemRequest;
import com.hotelpayroll.dto.MenuItemResponse;
import com.hotelpayroll.entity.CuisineType;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.service.MenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/menu-items")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;
    @Value("${app.upload.menu-dir:uploads/menu-items}")
    private String uploadDir;

    @PreAuthorize("hasAuthority('VIEW_MENU')")
    @GetMapping
    public List<MenuItemResponse> getAll(
            @RequestParam(required = false) CuisineType cuisine,
            @RequestParam(required = false) String search
    ) {
        return menuItemService.getAll(cuisine, search);
    }

    @PreAuthorize("hasAuthority('MANAGE_MENU') or hasRole('SUPER_ADMIN')")
    @PostMapping
    public MenuItemResponse create(@Valid @RequestBody MenuItemRequest request) {
        return menuItemService.create(request);
    }

    @PreAuthorize("hasAuthority('MANAGE_MENU') or hasRole('SUPER_ADMIN')")
    @PutMapping("/{id}")
    public MenuItemResponse update(@PathVariable Long id, @Valid @RequestBody MenuItemRequest request) {
        return menuItemService.update(id, request);
    }

    @PreAuthorize("hasAuthority('MANAGE_MENU') or hasRole('SUPER_ADMIN')")
    @PatchMapping("/{id}/availability")
    public MenuItemResponse updateAvailability(@PathVariable Long id, @RequestParam boolean available) {
        return menuItemService.updateAvailability(id, available);
    }

    @PreAuthorize("hasAuthority('MANAGE_MENU') or hasRole('SUPER_ADMIN')")
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MenuItemResponse uploadImage(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return menuItemService.uploadImage(id, file);
    }

    @GetMapping("/images/{fileName:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String fileName) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = uploadPath.resolve(fileName).normalize();
            if (!filePath.startsWith(uploadPath)) {
                throw new ResourceNotFoundException("Image not found");
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                throw new ResourceNotFoundException("Image not found");
            }
            String contentType = Files.probeContentType(filePath);
            return ResponseEntity.ok()
                    .contentType(contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("Image not found");
        } catch (Exception ex) {
            throw new ResourceNotFoundException("Image not found");
        }
    }

    @PreAuthorize("hasAuthority('MANAGE_MENU') or hasRole('SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        menuItemService.delete(id);
    }
}
