package com.claimdesk.service.storage;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "supabase")
public class SupabaseReceiptStorageService implements ReceiptStorageService {

    private final RestClient restClient;
    private final String supabaseUrl;
    private final String bucket;
    private final int signedUrlTtlSeconds;

    public SupabaseReceiptStorageService(
            @Value("${app.storage.supabase.url}") String supabaseUrl,
            @Value("${app.storage.supabase.service-role-key}") String serviceRoleKey,
            @Value("${app.storage.supabase.bucket}") String bucket,
            @Value("${app.storage.supabase.signed-url-ttl-seconds}") int signedUrlTtlSeconds
    ) {
        if (supabaseUrl == null || supabaseUrl.isBlank()
                || serviceRoleKey == null || serviceRoleKey.isBlank()
                || bucket == null || bucket.isBlank()) {
            throw new IllegalStateException("Supabase storage requires URL, service role key, and bucket");
        }

        this.supabaseUrl = supabaseUrl.replaceAll("/+$", "");
        this.bucket = bucket;
        this.signedUrlTtlSeconds = signedUrlTtlSeconds;
        this.restClient = RestClient.builder()
                .baseUrl(this.supabaseUrl)
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
                .defaultHeader("apikey", serviceRoleKey)
                .build();
    }

    @Override
    public StoredReceipt store(Long claimId, String originalFileName, String contentType, MultipartFile file) {
        String objectKey = "claims/" + claimId + "/" + UUID.randomUUID() + extensionOf(originalFileName);

        try {
            restClient.post()
                    .uri("/storage/v1/object/" + bucket + "/" + objectKey)
                    .contentType(MediaType.parseMediaType(contentType))
                    .header("x-upsert", "false")
                    .body(file.getBytes())
                    .retrieve()
                    .toBodilessEntity();
            return new StoredReceipt(objectKey);
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to store receipt in Supabase: " + supabaseError(exception)
            );
        } catch (IOException | RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to store receipt in Supabase: " + exception.getMessage()
            );
        }
    }

    @Override
    public LoadedReceipt load(String objectKey, String contentType, String originalFileName) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("/storage/v1/object/sign/" + bucket + "/" + objectKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("expiresIn", signedUrlTtlSeconds))
                    .retrieve()
                    .body(Map.class);

            Object signedUrl = response == null ? null : response.get("signedURL");
            if (signedUrl == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create signed receipt URL");
            }

            String url = String.valueOf(signedUrl);
            URI redirectUri = URI.create(url.startsWith("http") ? url : supabaseUrl + url);
            return LoadedReceipt.redirect(redirectUri);
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to load receipt from Supabase: " + supabaseError(exception)
            );
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to load receipt from Supabase: " + exception.getMessage()
            );
        }
    }

    @Override
    public void delete(String objectKey) {
        try {
            restClient.method(org.springframework.http.HttpMethod.DELETE)
                    .uri("/storage/v1/object/{bucket}", bucket)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("prefixes", List.of(objectKey)))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to delete receipt from Supabase: " + supabaseError(exception)
            );
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to delete receipt from Supabase: " + exception.getMessage()
            );
        }
    }

    private String supabaseError(RestClientResponseException exception) {
        String body = exception.getResponseBodyAsString();
        if (body == null || body.isBlank()) {
            return exception.getStatusCode().value() + " " + exception.getStatusText();
        }

        return exception.getStatusCode().value() + " " + body;
    }

    private String extensionOf(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0) {
            return "";
        }

        return fileName.substring(dotIndex).toLowerCase(Locale.ROOT);
    }
}
