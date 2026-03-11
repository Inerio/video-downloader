package com.videograb.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

    @Bean
    CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("videoInfo");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(200)
                .expireAfterWrite(5, TimeUnit.MINUTES));
        return cacheManager;
    }
}
