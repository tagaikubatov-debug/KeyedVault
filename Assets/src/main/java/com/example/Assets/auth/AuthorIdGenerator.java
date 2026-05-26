package com.example.Assets.auth;

import java.util.Locale;
import java.util.UUID;

public final class AuthorIdGenerator {

    private AuthorIdGenerator() {
    }

    public static String generate(String displayName, String email) {
        String handle = slugify(displayName != null && !displayName.isBlank()
                ? displayName
                : email.split("@")[0]);
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "ID:" + suffix + "_" + handle;
    }

    private static String slugify(String raw) {
        String slug = raw.trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
        if (slug.isEmpty()) {
            slug = "USER";
        }
        return slug.length() > 24 ? slug.substring(0, 24) : slug;
    }
}
