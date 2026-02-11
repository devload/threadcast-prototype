package io.threadcast.dto.response.admin;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminDashboardResponse {
    private long totalUsers;
    private long activeUsers;
    private long totalWorkspaces;
    private long activeMissions;
    private long totalTodos;
    private long completedTodos;
    private List<TrendPoint> userSignupTrend;
    private List<MissionTrendPoint> missionCompletionTrend;
    private List<AdminUserResponse> recentUsers;
    private List<AdminMissionResponse> activeMissions2;

    @Data
    @Builder
    public static class TrendPoint {
        private String date;
        private long count;
    }

    @Data
    @Builder
    public static class MissionTrendPoint {
        private String date;
        private long completed;
        private long total;
    }
}
