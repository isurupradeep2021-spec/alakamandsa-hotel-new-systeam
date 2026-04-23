package com.hotelpayroll.repository;

import com.hotelpayroll.entity.CuisineType;
import com.hotelpayroll.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCuisineOrderByNameAsc(CuisineType cuisine);
    List<MenuItem> findByNameContainingIgnoreCaseOrderByNameAsc(String search);
    List<MenuItem> findByCuisineAndNameContainingIgnoreCaseOrderByNameAsc(CuisineType cuisine, String search);
    List<MenuItem> findAllByOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
