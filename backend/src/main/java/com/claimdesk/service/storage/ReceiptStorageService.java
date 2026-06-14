package com.claimdesk.service.storage;

import org.springframework.web.multipart.MultipartFile;

public interface ReceiptStorageService {

    StoredReceipt store(Long claimId, String originalFileName, String contentType, MultipartFile file);

    LoadedReceipt load(String objectKey, String contentType, String originalFileName);

    void delete(String objectKey);
}
