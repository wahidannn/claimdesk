package com.claimdesk.service.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalReceiptStorageService implements ReceiptStorageService {

    private final Path receiptsDir;

    public LocalReceiptStorageService(@Value("${app.storage.receipts-dir}") String receiptsDir) {
        this.receiptsDir = Path.of(receiptsDir).toAbsolutePath().normalize();
    }

    @Override
    public StoredReceipt store(Long claimId, String originalFileName, String contentType, MultipartFile file) {
        String objectKey = claimId + "-" + UUID.randomUUID() + extensionOf(originalFileName);
        Path target = receiptsDir.resolve(objectKey).normalize();

        if (!target.startsWith(receiptsDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
        }

        try {
            Files.createDirectories(receiptsDir);
            file.transferTo(target);
            return new StoredReceipt(objectKey);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store receipt");
        }
    }

    @Override
    public LoadedReceipt load(String objectKey, String contentType, String originalFileName) {
        Path path = receiptsDir.resolve(objectKey).normalize();
        if (!path.startsWith(receiptsDir) || !Files.exists(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment file not found");
        }

        try {
            Resource resource = new UrlResource(path.toUri());
            return LoadedReceipt.resource(resource);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to load attachment");
        }
    }

    @Override
    public void delete(String objectKey) {
        Path path = receiptsDir.resolve(objectKey).normalize();

        try {
            if (path.startsWith(receiptsDir)) {
                Files.deleteIfExists(path);
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete attachment file");
        }
    }

    private String extensionOf(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0) {
            return "";
        }

        return fileName.substring(dotIndex).toLowerCase(Locale.ROOT);
    }
}
