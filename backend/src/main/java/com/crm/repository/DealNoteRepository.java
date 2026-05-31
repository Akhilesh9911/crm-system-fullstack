package com.crm.repository;
import com.crm.entity.DealNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface DealNoteRepository extends JpaRepository<DealNote, Long> {
}
