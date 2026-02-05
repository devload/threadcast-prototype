package io.threadcast.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendKeysRequest {

    @NotBlank(message = "Keys are required")
    private String keys;

    @Builder.Default
    private boolean enter = true;
}
