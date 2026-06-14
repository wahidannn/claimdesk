package com.claimdesk.service;

import com.claimdesk.dto.AuthUserResponse;
import com.claimdesk.dto.LoginRequest;
import com.claimdesk.dto.LoginResponse;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.User;
import com.claimdesk.exception.UnauthorizedException;
import com.claimdesk.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    public AuthResult login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = findActiveUser(userDetails.getUsername());
            auditLogService.record(
                    user.getEmail(),
                    AuditAction.AUTH_LOGIN,
                    AuditResourceType.AUTH,
                    user.getId(),
                    user.getEmail() + " logged in."
            );

            return new AuthResult(new LoginResponse(toAuthUser(user)), jwtService.generateToken(userDetails));
        } catch (BadCredentialsException exception) {
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    public AuthUserResponse getCurrentUser(String email) {
        return toAuthUser(findActiveUser(email));
    }

    public void logout(String email) {
        if (email == null) {
            return;
        }

        auditLogService.record(
                email,
                AuditAction.AUTH_LOGOUT,
                AuditResourceType.AUTH,
                null,
                email + " logged out."
        );
    }

    private User findActiveUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("User is not authenticated"));

        if (!user.isActive()) {
            throw new UnauthorizedException("User is inactive");
        }

        return user;
    }

    private AuthUserResponse toAuthUser(User user) {
        return new AuthUserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    public record AuthResult(LoginResponse response, String token) {
    }
}
