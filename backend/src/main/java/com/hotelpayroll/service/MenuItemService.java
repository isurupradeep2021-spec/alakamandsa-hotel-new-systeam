package com.hotelpayroll.service;

import com.hotelpayroll.dto.MenuItemRequest;
import com.hotelpayroll.dto.MenuItemResponse;
import com.hotelpayroll.entity.CuisineType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MenuItemService {
    MenuItemResponse create(MenuItemRequest request);
    MenuItemResponse update(Long id, MenuItemRequest request);
    MenuItemResponse updateAvailability(Long id, boolean available);
    MenuItemResponse uploadImage(Long id, MultipartFile file);
    List<MenuItemResponse> getAll(CuisineType cuisine, String search);
    void delete(Long id);
}
