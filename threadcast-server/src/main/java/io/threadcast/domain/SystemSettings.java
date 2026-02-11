package io.threadcast.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class SystemSettings {

    @Id
    @Column(length = 100)
    private String settingKey;

    @Column(columnDefinition = "TEXT")
    private String settingValue;
}
