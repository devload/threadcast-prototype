package io.threadcast.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.sessioncast.core.SessionCastClient;
import io.sessioncast.core.tmux.TmuxController;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;

/**
 * Service for managing the ThreadCast Hub agent.
 * The Hub is a central orchestrator that manages Worker agents for each Todo.
 *
 * Hub uses SessionCast to:
 * - Stream terminal to relay (for monitoring)
 * - Receive commands from relay (for orchestration)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HubService {

    private static final String HUB_SESSION_NAME = "threadcast-hub";
    private static final String HUB_DIR = System.getProperty("user.home") + "/.threadcast/.claude";
    private static final String STATE_FILE = HUB_DIR + "/state.json";

    private final SessionCastClient sessionCast;
    private final TmuxController tmuxController;
    private final ObjectMapper objectMapper;

    @Value("${server.port:21000}")
    private int serverPort;

    @Value("${threadcast.hub.auto-start:true}")
    private boolean autoStart;

    /**
     * Auto-start hub on server initialization if enabled.
     */
    @PostConstruct
    public void init() {
        if (autoStart) {
            CompletableFuture.runAsync(() -> {
                try {
                    // Wait for server to fully start
                    Thread.sleep(5000);
                    startHub();
                } catch (Exception e) {
                    log.warn("Failed to auto-start hub: {}", e.getMessage());
                }
            });
        }
    }

    /**
     * Start the Hub agent session.
     * Creates tmux session and connects to SessionCast relay for streaming.
     */
    public boolean startHub() {
        try {
            // Check if already running
            if (isHubRunning()) {
                log.info("Hub is already running");
                return true;
            }

            // Ensure directory exists
            Path hubPath = Path.of(HUB_DIR);
            if (!Files.exists(hubPath)) {
                Files.createDirectories(hubPath);
            }

            // Ensure connected to relay
            if (!sessionCast.isConnected()) {
                log.info("Connecting to SessionCast relay...");
                sessionCast.connect().join();
            }

            // Create tmux session via SessionCast (connects to relay automatically)
            log.info("Starting ThreadCast Hub session...");
            sessionCast.createSession(HUB_SESSION_NAME, HUB_DIR).join();
            Thread.sleep(500); // Wait for session to be ready

            // Set environment variables
            String apiUrl = "http://localhost:" + serverPort;
            sessionCast.sendKeys(HUB_SESSION_NAME, "export THREADCAST_API_URL=" + apiUrl, true).join();
            Thread.sleep(300);

            sessionCast.sendKeys(HUB_SESSION_NAME, "export THREADCAST_HUB=true", true).join();
            Thread.sleep(300);

            // Update state file
            updateHubState(true);

            // Launch Claude Code with dangerously-skip-permissions for automation
            sessionCast.sendKeys(HUB_SESSION_NAME, "claude --dangerously-skip-permissions", true).join();

            log.info("Hub started successfully: session={}, api={}", HUB_SESSION_NAME, apiUrl);
            return true;

        } catch (Exception e) {
            log.error("Failed to start hub: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Stop the Hub agent session.
     */
    public boolean stopHub() {
        try {
            if (!isHubRunning()) {
                log.info("Hub is not running");
                return true;
            }

            sessionCast.killSession(HUB_SESSION_NAME).join();
            updateHubState(false);

            log.info("Hub stopped successfully");
            return true;

        } catch (Exception e) {
            log.error("Failed to stop hub: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Check if Hub is running.
     */
    public boolean isHubRunning() {
        return tmuxController.sessionExists(HUB_SESSION_NAME);
    }

    /**
     * Get Hub status.
     */
    public HubStatus getStatus() {
        boolean running = isHubRunning();
        String screen = null;

        if (running) {
            try {
                screen = tmuxController.capturePane(HUB_SESSION_NAME, true);
            } catch (Exception e) {
                log.debug("Failed to capture hub screen: {}", e.getMessage());
            }
        }

        return new HubStatus(running, HUB_SESSION_NAME, screen, readStateFile());
    }

    /**
     * Send a command to the Hub via SessionCast.
     */
    public void sendToHub(String command) {
        if (!isHubRunning()) {
            throw new IllegalStateException("Hub is not running");
        }
        sessionCast.sendKeys(HUB_SESSION_NAME, command, true).join();
    }

    /**
     * Update hub state in state.json
     */
    private void updateHubState(boolean started) {
        try {
            File stateFile = new File(STATE_FILE);
            ObjectNode state;

            if (stateFile.exists()) {
                state = (ObjectNode) objectMapper.readTree(stateFile);
            } else {
                state = objectMapper.createObjectNode();
                state.putObject("active_workers");
                state.putArray("completed_todos");
                state.putArray("failed_todos");
                ObjectNode config = state.putObject("config");
                config.put("max_concurrent_workers", 3);
                config.put("poll_interval_seconds", 30);
                config.put("api_base_url", "http://localhost:" + serverPort);
            }

            if (started) {
                state.put("hub_started_at", Instant.now().toString());
            } else {
                state.putNull("hub_started_at");
            }
            state.put("hub_session", HUB_SESSION_NAME);

            objectMapper.writerWithDefaultPrettyPrinter().writeValue(stateFile, state);

        } catch (IOException e) {
            log.warn("Failed to update hub state: {}", e.getMessage());
        }
    }

    /**
     * Read current state from state.json
     */
    private String readStateFile() {
        try {
            File stateFile = new File(STATE_FILE);
            if (stateFile.exists()) {
                return Files.readString(stateFile.toPath());
            }
        } catch (IOException e) {
            log.debug("Failed to read state file: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Hub status record.
     */
    public record HubStatus(
            boolean running,
            String sessionName,
            String lastScreen,
            String stateJson
    ) {}
}
