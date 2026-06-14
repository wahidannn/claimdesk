package com.claimdesk.controller;

import com.claimdesk.dto.AuthUserResponse;
import com.claimdesk.dto.LoginRequest;
import com.claimdesk.dto.LoginResponse;
import com.claimdesk.security.JwtAuthenticationFilter;
import com.claimdesk.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final long jwtExpirationMs;
    private final boolean secureCookie;
    private final String sameSiteCookie;

    public AuthController(
            AuthService authService,
            @Value("${app.security.jwt.expiration-ms}") long jwtExpirationMs,
            @Value("${app.security.cookie.secure}") boolean secureCookie,
            @Value("${app.security.cookie.same-site:Lax}") String sameSiteCookie
    ) {
        this.authService = authService;
        this.jwtExpirationMs = jwtExpirationMs;
        this.secureCookie = secureCookie;
        this.sameSiteCookie = sameSiteCookie;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthService.AuthResult result = authService.login(request);
        response.addHeader(HttpHeaders.SET_COOKIE, buildAccessTokenCookie(result.token(), jwtExpirationMs / 1000));

        return result.response();
    }

    @GetMapping("/me")
    public AuthUserResponse me(Principal principal) {
        return authService.getCurrentUser(principal.getName());
    }

    @PostMapping("/logout")
    public void logout(Principal principal, HttpServletResponse response) {
        authService.logout(principal == null ? null : principal.getName());
        response.addHeader(HttpHeaders.SET_COOKIE, buildAccessTokenCookie("", 0));
    }

    private String buildAccessTokenCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from(JwtAuthenticationFilter.ACCESS_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSiteCookie)
                .path("/")
                .maxAge(maxAgeSeconds)
                .build()
                .toString();
    }
}
