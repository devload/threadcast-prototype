package io.threadcast.service.admin;

import io.threadcast.domain.Mission;
import io.threadcast.domain.User;
import io.threadcast.domain.enums.MissionStatus;
import io.threadcast.domain.enums.TodoStatus;
import io.threadcast.dto.response.admin.AdminDashboardResponse;
import io.threadcast.dto.response.admin.AdminMissionResponse;
import io.threadcast.dto.response.admin.AdminUserResponse;
import io.threadcast.repository.MissionRepository;
import io.threadcast.repository.TodoRepository;
import io.threadcast.repository.UserRepository;
import io.threadcast.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final MissionRepository missionRepository;
    private final TodoRepository todoRepository;

    public AdminDashboardResponse getDashboardStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.count(); // simplified: all users are "active"
        long totalWorkspaces = workspaceRepository.count();
        long totalMissions = missionRepository.count();
        long activeMissions = missionRepository.findAll().stream()
                .filter(m -> m.getStatus() == MissionStatus.THREADING)
                .count();
        long totalTodos = todoRepository.count();
        long completedTodos = todoRepository.findAll().stream()
                .filter(t -> t.getStatus() == TodoStatus.WOVEN)
                .count();

        // User signup trend (last 30 days) - simplified
        List<AdminDashboardResponse.TrendPoint> userSignupTrend = new ArrayList<>();
        LocalDate now = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        for (int i = 29; i >= 0; i--) {
            LocalDate date = now.minusDays(i);
            userSignupTrend.add(AdminDashboardResponse.TrendPoint.builder()
                    .date(date.format(fmt))
                    .count(0) // would need createdAt-based query for real data
                    .build());
        }

        // Mission completion trend (last 8 weeks) - simplified
        List<AdminDashboardResponse.MissionTrendPoint> missionTrend = new ArrayList<>();
        for (int i = 7; i >= 0; i--) {
            LocalDate weekStart = now.minusWeeks(i);
            missionTrend.add(AdminDashboardResponse.MissionTrendPoint.builder()
                    .date(weekStart.format(fmt))
                    .completed(0)
                    .total(totalMissions)
                    .build());
        }

        // Recent users
        List<User> recentUsersList = userRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        List<AdminUserResponse> recentUsers = recentUsersList.stream()
                .map(AdminUserResponse::from)
                .collect(Collectors.toList());

        // Active missions
        List<Mission> activeMissionsList = missionRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        List<AdminMissionResponse> activeMissionsResp = activeMissionsList.stream()
                .map(AdminMissionResponse::from)
                .collect(Collectors.toList());

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalWorkspaces(totalWorkspaces)
                .activeMissions(activeMissions)
                .totalTodos(totalTodos)
                .completedTodos(completedTodos)
                .userSignupTrend(userSignupTrend)
                .missionCompletionTrend(missionTrend)
                .recentUsers(recentUsers)
                .activeMissions2(activeMissionsResp)
                .build();
    }
}
