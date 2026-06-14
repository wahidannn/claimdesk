package com.claimdesk.controller;

import com.claimdesk.dto.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import java.time.OffsetDateTime;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    @Operation(summary = "Check API health")
    public HealthResponse health() {
        return new HealthResponse("UP", "claimdesk-api", OffsetDateTime.now());
    }
}
