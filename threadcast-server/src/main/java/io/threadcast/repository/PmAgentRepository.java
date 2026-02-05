package io.threadcast.repository;

import io.threadcast.domain.PmAgent;
import io.threadcast.domain.enums.PmAgentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PmAgentRepository extends JpaRepository<PmAgent, UUID> {

    /**
     * Workspace ID로 PM Agent 조회 (Workspace 함께 로드)
     */
    @Query("SELECT pa FROM PmAgent pa " +
           "JOIN FETCH pa.workspace w " +
           "WHERE w.id = :workspaceId")
    Optional<PmAgent> findByWorkspaceId(@Param("workspaceId") UUID workspaceId);

    /**
     * Machine ID로 PM Agent 조회
     */
    Optional<PmAgent> findByMachineId(String machineId);

    /**
     * 연결된 모든 Agent 조회
     */
    @Query("SELECT pa FROM PmAgent pa WHERE pa.status != 'DISCONNECTED'")
    List<PmAgent> findAllConnected();

    /**
     * Heartbeat 타임아웃된 Agent 조회 (60초 기준)
     */
    @Query("SELECT pa FROM PmAgent pa " +
           "WHERE pa.status != 'DISCONNECTED' " +
           "AND pa.lastHeartbeat < :threshold")
    List<PmAgent> findTimedOutAgents(@Param("threshold") LocalDateTime threshold);

    /**
     * 타임아웃된 Agent들을 DISCONNECTED로 일괄 업데이트
     */
    @Modifying
    @Query("UPDATE PmAgent pa SET pa.status = 'DISCONNECTED', pa.disconnectedAt = :now " +
           "WHERE pa.status != 'DISCONNECTED' " +
           "AND pa.lastHeartbeat < :threshold")
    int markTimedOutAsDisconnected(@Param("threshold") LocalDateTime threshold, @Param("now") LocalDateTime now);

    /**
     * Workspace ID로 PM Agent 존재 여부 확인
     */
    boolean existsByWorkspaceId(UUID workspaceId);

    /**
     * Workspace ID로 PM Agent 삭제
     */
    void deleteByWorkspaceId(UUID workspaceId);
}
