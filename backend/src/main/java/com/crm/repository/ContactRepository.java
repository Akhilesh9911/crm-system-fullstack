package com.crm.repository;
import com.crm.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    @Override
    @Query("SELECT DISTINCT c FROM Contact c")
    List<Contact> findAll();

    Optional<Contact> findByEmailIgnoreCase(String email);
}
