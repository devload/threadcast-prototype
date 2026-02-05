package io.threadcast.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String avatarUrl;

    @Column(unique = true)
    private String sessioncastId;  // SessionCast sub (UUID)

    private String oauthProvider;  // "sessioncast" or null (local)

    @Column(nullable = false)
    @Builder.Default
    private Integer autonomyLevel = 3;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Workspace> workspaces = new ArrayList<>();
}
