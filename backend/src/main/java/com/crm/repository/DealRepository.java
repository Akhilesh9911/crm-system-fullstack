package com.crm.repository;
import com.crm.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealRepository extends JpaRepository<Deal, Long> {
    @Override
    @Query("SELECT DISTINCT d FROM Deal d")
    List<Deal> findAll();
}
