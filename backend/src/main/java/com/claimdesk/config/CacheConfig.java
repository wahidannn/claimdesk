package com.claimdesk.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.databind.json.JsonMapper;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String EMPLOYEE_DASHBOARD = "employeeDashboard";
    public static final String ADMIN_DASHBOARD = "adminDashboard";
    public static final String MANAGER_DASHBOARD = "managerDashboard";
    public static final String FINANCE_DASHBOARD = "financeDashboard";
    public static final String DASHBOARD_SUMMARY = "dashboardSummary";
    public static final String ACTIVE_CATEGORIES = "activeCategories";
    public static final String NOTIFICATION_UNREAD_COUNT = "notificationUnreadCount";
    public static final String CLAIM_REPORT_SUMMARY = "claimReportSummary";

    @Bean
    public RedisCacheConfiguration redisCacheConfiguration(
            @Value("${app.cache.ttl.dashboard-seconds}") long dashboardTtlSeconds
    ) {
        return cacheConfiguration(dashboardTtlSeconds);
    }

    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer(
            @Value("${app.cache.ttl.dashboard-seconds}") long dashboardTtlSeconds,
            @Value("${app.cache.ttl.reference-seconds}") long referenceTtlSeconds,
            @Value("${app.cache.ttl.notification-seconds}") long notificationTtlSeconds
    ) {
        RedisCacheConfiguration dashboardConfig = cacheConfiguration(dashboardTtlSeconds);
        RedisCacheConfiguration referenceConfig = cacheConfiguration(referenceTtlSeconds);
        RedisCacheConfiguration notificationConfig = cacheConfiguration(notificationTtlSeconds);

        return builder -> builder
                .withCacheConfiguration(EMPLOYEE_DASHBOARD, dashboardConfig)
                .withCacheConfiguration(ADMIN_DASHBOARD, dashboardConfig)
                .withCacheConfiguration(MANAGER_DASHBOARD, dashboardConfig)
                .withCacheConfiguration(FINANCE_DASHBOARD, dashboardConfig)
                .withCacheConfiguration(DASHBOARD_SUMMARY, dashboardConfig)
                .withCacheConfiguration(CLAIM_REPORT_SUMMARY, dashboardConfig)
                .withCacheConfiguration(ACTIVE_CATEGORIES, referenceConfig)
                .withCacheConfiguration(NOTIFICATION_UNREAD_COUNT, notificationConfig);
    }

    private RedisCacheConfiguration cacheConfiguration(long ttlSeconds) {
        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(ttlSeconds))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer()));
    }

    private GenericJackson2JsonRedisSerializer jsonSerializer() {
        ObjectMapper objectMapper = JsonMapper.builder()
                .findAndAddModules()
                .build();
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.EVERYTHING,
                JsonTypeInfo.As.PROPERTY
        );
        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }
}
