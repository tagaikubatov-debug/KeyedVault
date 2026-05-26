package com.example.Assets.auth.dto;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private long   expiresInMs;
    private String email;
    private String username;
    private String displayName;
    private String authorId;

    public AuthResponse() {}

    public AuthResponse(String token, long expiresInMs,
                        String email, String username,
                        String displayName, String authorId) {
        this.token        = token;
        this.expiresInMs  = expiresInMs;
        this.email        = email;
        this.username     = username;
        this.displayName  = displayName;
        this.authorId     = authorId;
    }

    public String getToken()        { return token; }
    public String getTokenType()    { return tokenType; }
    public long   getExpiresInMs()  { return expiresInMs; }
    public String getEmail()        { return email; }
    public String getUsername()     { return username; }
    public String getDisplayName()  { return displayName; }
    public String getAuthorId()     { return authorId; }
}
