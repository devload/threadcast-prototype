package io.threadcast.service.admin;

import io.threadcast.domain.User;
import io.threadcast.domain.enums.UserRole;
import io.threadcast.dto.response.admin.AdminUserResponse;
import io.threadcast.exception.BadRequestException;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getUsers(int page, int size, String search,
                                         String role, String status, String sortBy, String sortDir) {
        Sort sort = Sort.by(
                "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC,
                sortBy != null ? sortBy : "createdAt");
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        Page<User> userPage = userRepository.findAll(pageRequest);

        // Apply filters in-memory for simplicity (can be optimized with custom queries)
        List<AdminUserResponse> users = userPage.getContent().stream()
                .filter(u -> search == null || search.isEmpty()
                        || u.getName().toLowerCase().contains(search.toLowerCase())
                        || u.getEmail().toLowerCase().contains(search.toLowerCase()))
                .filter(u -> role == null || role.isEmpty() || role.equals("All")
                        || u.getRole().name().equals(role))
                .filter(u -> status == null || status.isEmpty() || status.equals("All")
                        || u.getStatus().equals(status))
                .map(AdminUserResponse::from)
                .collect(Collectors.toList());

        return Map.of(
                "content", users,
                "totalElements", userPage.getTotalElements(),
                "totalPages", userPage.getTotalPages(),
                "page", page,
                "size", size
        );
    }

    @Transactional
    public AdminUserResponse updateUserRole(UUID userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        try {
            UserRole role = UserRole.valueOf(newRole.toUpperCase());
            user.setRole(role);
            userRepository.save(user);
            return AdminUserResponse.from(user);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + newRole);
        }
    }

    @Transactional
    public AdminUserResponse updateUserStatus(UUID userId, String newStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        List<String> validStatuses = List.of("active", "suspended", "inactive");
        if (!validStatuses.contains(newStatus)) {
            throw new BadRequestException("Invalid status: " + newStatus + ". Must be one of: " + validStatuses);
        }

        user.setStatus(newStatus);
        userRepository.save(user);
        return AdminUserResponse.from(user);
    }
}
