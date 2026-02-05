package io.threadcast.domain;

import io.threadcast.domain.enums.PmAgentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PM Agent 연결 정보
 * Workspace 당 하나의 PM Agent만 허용
 */
@Entity
@Table(name = "pm_agent", uniqueConstraints = {
        @UniqueConstraint(name = "uk_pm_agent_workspace", columnNames = "workspace_id")
})
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PmAgent extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    /**
     * SessionCast Machine ID
     */
    @Column(nullable = false, length = 100)
    private String machineId;

    /**
     * Agent 표시 이름
     */
    @Column(length = 200)
    private String label;

    /**
     * 연결 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PmAgentStatus status = PmAgentStatus.DISCONNECTED;

    /**
     * 마지막 heartbeat 시간
     */
    private LocalDateTime lastHeartbeat;

    /**
     * 현재 작업 중인 Todo ID
     */
    private UUID currentTodoId;

    /**
     * 현재 작업 중인 Todo 제목 (캐시)
     */
    @Column(length = 500)
    private String currentTodoTitle;

    /**
     * 활성 Todo 개수
     */
    @Builder.Default
    private Integer activeTodoCount = 0;

    /**
     * Agent 버전 정보
     */
    @Column(length = 50)
    private String agentVersion;

    /**
     * 연결 시작 시간
     */
    private LocalDateTime connectedAt;

    /**
     * 연결 해제 시간
     */
    private LocalDateTime disconnectedAt;

    /**
     * Agent 연결
     */
    public void connect(String machineId, String label, String agentVersion) {
        this.machineId = machineId;
        this.label = label;
        this.agentVersion = agentVersion;
        this.status = PmAgentStatus.CONNECTED;
        this.connectedAt = LocalDateTime.now();
        this.lastHeartbeat = LocalDateTime.now();
        this.disconnectedAt = null;
    }

    /**
     * Agent 연결 해제
     */
    public void disconnect() {
        this.status = PmAgentStatus.DISCONNECTED;
        this.disconnectedAt = LocalDateTime.now();
        this.currentTodoId = null;
        this.currentTodoTitle = null;
        this.activeTodoCount = 0;
    }

    /**
     * Heartbeat 업데이트
     */
    public void heartbeat() {
        this.lastHeartbeat = LocalDateTime.now();
        if (this.status == PmAgentStatus.DISCONNECTED) {
            this.status = PmAgentStatus.CONNECTED;
            this.connectedAt = LocalDateTime.now();
        }
    }

    /**
     * 작업 시작
     */
    public void startWork(UUID todoId, String todoTitle) {
        this.status = PmAgentStatus.WORKING;
        this.currentTodoId = todoId;
        this.currentTodoTitle = todoTitle;
        this.lastHeartbeat = LocalDateTime.now();
    }

    /**
     * 작업 완료/중단
     */
    public void finishWork() {
        this.status = PmAgentStatus.CONNECTED;
        this.currentTodoId = null;
        this.currentTodoTitle = null;
        this.lastHeartbeat = LocalDateTime.now();
    }

    /**
     * 활성 Todo 개수 업데이트
     */
    public void updateActiveTodoCount(int count) {
        this.activeTodoCount = count;
    }

    /**
     * 연결 상태 확인 (heartbeat 타임아웃 기준)
     * 60초 이상 heartbeat 없으면 disconnected로 간주
     */
    public boolean isOnline() {
        if (status == PmAgentStatus.DISCONNECTED) {
            return false;
        }
        if (lastHeartbeat == null) {
            return false;
        }
        return lastHeartbeat.plusSeconds(60).isAfter(LocalDateTime.now());
    }

    /**
     * 실제 상태 반환 (타임아웃 고려)
     */
    public PmAgentStatus getEffectiveStatus() {
        if (!isOnline()) {
            return PmAgentStatus.DISCONNECTED;
        }
        return status;
    }
}
