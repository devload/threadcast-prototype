package io.threadcast.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import io.threadcast.domain.*;
import io.threadcast.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

/**
 * SessionCast 프로필용 초기 데이터 생성
 * 파일 기반 H2 DB를 사용하므로 한번만 실행됨
 */
@Slf4j
@Component
@Profile("sessioncast")
@RequiredArgsConstructor
public class SessionCastDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${server.port:21000}")
    private int serverPort;

    @Override
    @Transactional
    public void run(String... args) {
        // SwiftCast 설정 초기화 (항상 실행 - 설정 파일 동기화)
        initializeSwiftCastConfig();

        // 이미 데이터가 있으면 스킵
        if (userRepository.count() > 0) {
            log.info("========================================");
            log.info("   SessionCast: 기존 데이터 유지");
            log.info("   Users: {}, Workspaces: {}",
                userRepository.count(), workspaceRepository.count());
            log.info("========================================");
            return;
        }

        log.info("========================================");
        log.info("   SessionCast 초기 데이터 생성 시작");
        log.info("========================================");

        User user = createUser();
        Workspace workspace = createWorkspace(user);
        createProjects(workspace);

        log.info("========================================");
        log.info("   SessionCast 초기화 완료!");
        log.info("   계정: dev@sessioncast.io / dev1234");
        log.info("   워크스페이스: SessionCast Development");
        log.info("   DB 위치: ./data/threadcast-sessioncast.mv.db");
        log.info("========================================");
    }

    private User createUser() {
        User user = User.builder()
                .email("dev@sessioncast.io")
                .passwordHash(passwordEncoder.encode("dev1234"))
                .name("SessionCast Dev")
                .avatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=sessioncast")
                .autonomyLevel(3)
                .build();
        return userRepository.save(user);
    }

    private Workspace createWorkspace(User owner) {
        String homePath = System.getProperty("user.home");
        Workspace workspace = Workspace.builder()
                .name("SessionCast Development")
                .description("ThreadCast 개발을 위한 워크스페이스 - SwiftCast/SessionCast 연동 개발")
                .path(homePath + "/threadcast")
                .owner(owner)
                .build();
        return workspaceRepository.save(workspace);
    }

    private void createProjects(Workspace workspace) {
        Project serverProject = Project.builder()
                .workspace(workspace)
                .name("threadcast-server")
                .description("Spring Boot 백엔드 API 서버")
                .path("./threadcast-server")
                .language("Java")
                .buildTool("Gradle")
                .build();
        projectRepository.save(serverProject);

        Project webProject = Project.builder()
                .workspace(workspace)
                .name("threadcast-web")
                .description("React 프론트엔드 웹 클라이언트")
                .path("./threadcast-web")
                .language("TypeScript")
                .buildTool("Vite")
                .build();
        projectRepository.save(webProject);
    }

    /**
     * SwiftCast 설정 초기화
     * - Custom Task 등록 (tasks.json)
     * - Webhook URL 설정 (settings.json 또는 DB)
     */
    private void initializeSwiftCastConfig() {
        String homePath = System.getProperty("user.home");
        Path sessioncastDir = Path.of(homePath, ".sessioncast");
        Path tasksFile = sessioncastDir.resolve("tasks.json");

        try {
            // .sessioncast 디렉토리 생성
            if (!Files.exists(sessioncastDir)) {
                Files.createDirectories(sessioncastDir);
                log.info("Created .sessioncast directory: {}", sessioncastDir);
            }

            // tasks.json 생성/업데이트
            String webhookUrl = "http://localhost:" + serverPort + "/api/webhooks/session-mapping";
            List<Map<String, Object>> tasks = List.of(
                Map.of(
                    "name", "register_session",
                    "description", "Register SwiftCast session ID with ThreadCast todo mapping",
                    "task_type", "http",
                    "url", webhookUrl,
                    "http_method", "POST"
                )
            );

            ObjectMapper mapper = new ObjectMapper();
            mapper.enable(SerializationFeature.INDENT_OUTPUT);

            // 기존 파일이 있으면 내용 확인 후 필요시 업데이트
            boolean needsUpdate = true;
            if (Files.exists(tasksFile)) {
                try {
                    String existingContent = Files.readString(tasksFile);
                    String newContent = mapper.writeValueAsString(tasks);
                    // register_session task가 이미 있는지 확인
                    if (existingContent.contains("register_session") &&
                        existingContent.contains(webhookUrl)) {
                        needsUpdate = false;
                        log.debug("SwiftCast tasks.json already configured");
                    }
                } catch (Exception e) {
                    log.warn("Failed to read existing tasks.json, will overwrite: {}", e.getMessage());
                }
            }

            if (needsUpdate) {
                mapper.writeValue(tasksFile.toFile(), tasks);
                log.info("========================================");
                log.info("   SwiftCast Custom Task 설정 완료");
                log.info("   파일: {}", tasksFile);
                log.info("   Webhook URL: {}", webhookUrl);
                log.info("========================================");
            }

            // SwiftCast settings.db에 webhook URL 설정 (SQLite)
            configureSwiftCastWebhook(homePath);

        } catch (Exception e) {
            log.error("Failed to initialize SwiftCast config: {}", e.getMessage(), e);
        }
    }

    /**
     * SwiftCast의 SQLite DB에 webhook URL 설정
     */
    private void configureSwiftCastWebhook(String homePath) {
        Path swiftcastDb = Path.of(homePath, ".config", "com.swiftcast.app", "data.db");

        if (!Files.exists(swiftcastDb)) {
            log.debug("SwiftCast DB not found at {}, skipping webhook config", swiftcastDb);
            return;
        }

        String webhookUrl = "http://localhost:" + serverPort;

        try {
            // SQLite JDBC로 직접 설정 (추후 구현 - 현재는 SwiftCast UI에서 설정 필요)
            // 또는 SwiftCast API를 통해 설정
            log.info("========================================");
            log.info("   SwiftCast Webhook 설정 필요");
            log.info("   SwiftCast 설정에서 Webhook URL을 입력하세요:");
            log.info("   URL: {}", webhookUrl);
            log.info("========================================");
        } catch (Exception e) {
            log.warn("Failed to configure SwiftCast webhook: {}", e.getMessage());
        }
    }
}
