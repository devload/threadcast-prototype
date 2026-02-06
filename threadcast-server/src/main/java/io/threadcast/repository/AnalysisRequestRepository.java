package io.threadcast.repository;

import io.threadcast.domain.AnalysisRequest;
import io.threadcast.domain.enums.AnalysisStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnalysisRequestRepository extends JpaRepository<AnalysisRequest, UUID> {

    Page<AnalysisRequest> findByWorkspaceId(UUID workspaceId, Pageable pageable);

    List<AnalysisRequest> findByWorkspaceIdAndStatus(UUID workspaceId, AnalysisStatus status);

    @Query("SELECT ar FROM AnalysisRequest ar " +
           "JOIN FETCH ar.workspace " +
           "LEFT JOIN FETCH ar.mission " +
           "WHERE ar.id = :id")
    Optional<AnalysisRequest> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT ar FROM AnalysisRequest ar " +
           "WHERE ar.workspace.id = :workspaceId " +
           "AND ar.status IN :statuses " +
           "ORDER BY ar.createdAt DESC")
    List<AnalysisRequest> findByWorkspaceIdAndStatusIn(
            @Param("workspaceId") UUID workspaceId,
            @Param("statuses") List<AnalysisStatus> statuses);

    long countByWorkspaceIdAndStatus(UUID workspaceId, AnalysisStatus status);
}
