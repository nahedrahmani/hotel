package tn.esprit.rhservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.esprit.rhservice.entity.Shift;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {

    @Query("SELECT s FROM Shift s JOIN FETCH s.employe WHERE s.employe.id = :employeId")
    List<Shift> findByEmployeId(Long employeId);

    @Query("SELECT s FROM Shift s JOIN FETCH s.employe WHERE s.date = :date")
    List<Shift> findByDate(LocalDate date);

    @Query("SELECT s FROM Shift s JOIN FETCH s.employe WHERE s.date BETWEEN :debut AND :fin")
    List<Shift> findByDateBetween(LocalDate debut, LocalDate fin);

    @Query("SELECT s FROM Shift s JOIN FETCH s.employe WHERE s.employe.id = :employeId AND s.date BETWEEN :debut AND :fin")
    List<Shift> findByEmployeIdAndDateBetween(Long employeId, LocalDate debut, LocalDate fin);

    @Query("SELECT s FROM Shift s JOIN FETCH s.employe WHERE s.date BETWEEN :debut AND :fin ORDER BY s.date, s.heureDebut")
    List<Shift> findPlanningByPeriode(LocalDate debut, LocalDate fin);
}
