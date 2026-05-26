package com.example.Assets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableAsync; // Добавился только этот импорт

@SpringBootApplication
@EnableAsync // Добавилась только эта строчка — она безопасна
public class Application {

    // Professional standard: Always use SLF4J for logging instead of System.out.println
    private static final Logger log = LoggerFactory.getLogger(Application.class);

    public static void main(String[] args) {
       // Твой оригинальный код инициализации — без изменений
       SpringApplication app = new SpringApplication(Application.class);
       Environment env = app.run(args).getEnvironment();

       // Fetch the server port (defaults to 8080 if not set in application.properties)
       String port = env.getProperty("server.port", "8080");
       String appName = env.getProperty("spring.application.name", "KEYED Enterprise Vault");
       String dbUrl = env.getProperty("spring.datasource.url", "unknown");

       // Print a clean, readable startup banner in the terminal
       log.info("\n----------------------------------------------------------\n\t" +
             "Status: SUCCESS \n\t" +
             "Application: {} \n\t" +
             "Access URL:  http://localhost:{}\n\t" +
             "Database:    {}\n" +
             "----------------------------------------------------------",
             appName, port, dbUrl);
    }
}