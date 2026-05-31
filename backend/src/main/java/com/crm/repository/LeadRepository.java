package com.crm.repository;
import com.crm.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    @Override
    @Query("SELECT DISTINCT l FROM Lead l")
    List<Lead> findAll();

    Optional<Lead> findByEmail(String email);
    Optional<Lead> findByEmailIgnoreCase(String email);
}
