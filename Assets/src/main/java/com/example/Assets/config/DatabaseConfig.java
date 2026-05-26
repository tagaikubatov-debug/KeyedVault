package com.example.Assets.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Bean
    public DataSource dataSource() {
        String rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.isEmpty()) {
            rawUrl = System.getenv("DATABASE_URL");
        }

        HikariConfig config = new HikariConfig();
        config.setDriverClassName("org.postgresql.Driver");

        if (rawUrl != null && !rawUrl.isEmpty()) {
            // Если Render передал строку в формате postgresql://user:pass@host:port/db
            if (rawUrl.startsWith("postgresql://")) {
                try {
                    // Убираем схему
                    String cleanUrl = rawUrl.replace("postgresql://", "");

                    // Разделяем на credentials и host/db
                    String[] authAndHost = cleanUrl.split("@");
                    String[] credentials = authAndHost[0].split(":");
                    String username = credentials[0];
                    String password = credentials[1];

                    String[] hostAndDb = authAndHost[1].split("/");
                    String hostWithPort = hostAndDb[0];
                    String databaseName = hostAndDb[1];

                    // Явно прописываем параметры пула, минуя сырой парсинг URL драйвером
                    String jdbcUrl = "jdbc:postgresql://" + hostWithPort + "/" + databaseName;

                    config.setJdbcUrl(jdbcUrl);
                    config.setUsername(username);
                    config.setPassword(password);

                } catch (Exception e) {
                    // Если регулярка упала, пробуем фолбэк с прямым добавлением jdbc:
                    config.setJdbcUrl("jdbc:" + rawUrl);
                }
            } else {
                config.setJdbcUrl(rawUrl);
            }
        } else {
            // Локальный фолбэк для разработки
            config.setJdbcUrl("jdbc:postgresql://localhost:5432/keyed");
            config.setUsername("postgres");
            config.setPassword("keyed_secure"); // ИСПРАВЛЕНО ЗДЕСЬ
        }

        // Оптимальные тайм-ауты для облачных БД
        config.setInitializationFailTimeout(60000);
        config.setConnectionTimeout(30000);

        return new HikariDataSource(config);
    }
}