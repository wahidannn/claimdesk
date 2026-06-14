package com.claimdesk.service.storage;

import java.net.URI;
import org.springframework.core.io.Resource;

public record LoadedReceipt(
        Resource resource,
        URI redirectUri
) {
    public static LoadedReceipt resource(Resource resource) {
        return new LoadedReceipt(resource, null);
    }

    public static LoadedReceipt redirect(URI redirectUri) {
        return new LoadedReceipt(null, redirectUri);
    }

    public boolean isRedirect() {
        return redirectUri != null;
    }
}
