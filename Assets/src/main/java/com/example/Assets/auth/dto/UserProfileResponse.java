package com.example.Assets.auth.dto;

public class UserProfileResponse {

    private String email;
    private String displayName;
    private String authorId;

    public UserProfileResponse(String email, String displayName, String authorId) {
        this.email = email;
        this.displayName = displayName;
        this.authorId = authorId;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getAuthorId() {
        return authorId;
    }
}
