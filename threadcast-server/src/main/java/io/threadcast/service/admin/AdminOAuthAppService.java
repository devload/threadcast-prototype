package io.threadcast.service.admin;

import io.threadcast.domain.OAuthApp;
import io.threadcast.dto.request.admin.CreateOAuthAppRequest;
import io.threadcast.dto.response.admin.OAuthAppResponse;
import io.threadcast.exception.NotFoundException;
import io.threadcast.repository.OAuthAppRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOAuthAppService {

    private final OAuthAppRepository oauthAppRepository;

    @Transactional(readOnly = true)
    public List<OAuthAppResponse> listApps() {
        return oauthAppRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OAuthAppResponse createApp(CreateOAuthAppRequest request) {
        String clientId = "tc_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        String clientSecret = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        OAuthApp app = OAuthApp.builder()
                .name(request.getName())
                .description(request.getDescription())
                .clientId(clientId)
                .clientSecret(clientSecret)
                .redirectUri(request.getRedirectUri())
                .homepageUrl(request.getHomepageUrl())
                .logoUrl(request.getLogoUrl())
                .firstParty(request.getFirstParty() != null && request.getFirstParty())
                .build();

        app = oauthAppRepository.save(app);

        return OAuthAppResponse.builder()
                .id(app.getId())
                .name(app.getName())
                .description(app.getDescription())
                .clientId(app.getClientId())
                .clientSecret(clientSecret) // only shown on creation
                .redirectUri(app.getRedirectUri())
                .homepageUrl(app.getHomepageUrl())
                .logoUrl(app.getLogoUrl())
                .firstParty(app.getFirstParty())
                .createdAt(app.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteApp(UUID id) {
        if (!oauthAppRepository.existsById(id)) {
            throw new NotFoundException("OAuth app not found: " + id);
        }
        oauthAppRepository.deleteById(id);
    }

    @Transactional
    public OAuthAppResponse regenerateSecret(UUID id) {
        OAuthApp app = oauthAppRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("OAuth app not found: " + id));

        String newSecret = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        app.setClientSecret(newSecret);
        oauthAppRepository.save(app);

        return OAuthAppResponse.builder()
                .id(app.getId())
                .name(app.getName())
                .description(app.getDescription())
                .clientId(app.getClientId())
                .clientSecret(newSecret) // show new secret
                .redirectUri(app.getRedirectUri())
                .homepageUrl(app.getHomepageUrl())
                .logoUrl(app.getLogoUrl())
                .firstParty(app.getFirstParty())
                .createdAt(app.getCreatedAt())
                .build();
    }

    private OAuthAppResponse toResponse(OAuthApp app) {
        return OAuthAppResponse.builder()
                .id(app.getId())
                .name(app.getName())
                .description(app.getDescription())
                .clientId(app.getClientId())
                // clientSecret NOT included in list responses
                .redirectUri(app.getRedirectUri())
                .homepageUrl(app.getHomepageUrl())
                .logoUrl(app.getLogoUrl())
                .firstParty(app.getFirstParty())
                .createdAt(app.getCreatedAt())
                .build();
    }
}
