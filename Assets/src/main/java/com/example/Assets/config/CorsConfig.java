package com.example.Assets.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // 1. ИСПРАВЛЕНИЕ: Разрешаем любые домены (Vercel, localhost и т.д.)
        config.setAllowedOriginPatterns(List.of("*"));

        // 2. Явно разрешаем все нужные методы, включая OPTIONS для префлайт-запросов
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // 3. Разрешаем любые заголовки
        config.setAllowedHeaders(List.of("*"));

        // 4. Разрешаем передачу токенов/куки
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Применяем эти правила ко всем эндпоинтам бэкенда
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}