package com.example.Assets.auth.dto;

import com.example.Assets.model.Gender;
import jakarta.validation.constraints.*;

public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be 3–30 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username: letters, numbers, underscore only")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Please confirm your password")
    private String confirmPassword;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be 2–100 characters")
    private String displayName;

    @Size(max = 30, message = "Phone number too long")
    @Pattern(regexp = "^\\+?[\\d\\s\\-().]{7,20}$", message = "Enter a valid phone number")
    private String phoneNumber;

    private Gender gender;

    // Getters & Setters
    public String getEmail()                        { return email; }
    public void   setEmail(String email)            { this.email = email; }
    public String getUsername()                     { return username; }
    public void   setUsername(String username)      { this.username = username; }
    public String getPassword()                     { return password; }
    public void   setPassword(String password)      { this.password = password; }
    public String getConfirmPassword()              { return confirmPassword; }
    public void   setConfirmPassword(String cp)     { this.confirmPassword = cp; }
    public String getDisplayName()                  { return displayName; }
    public void   setDisplayName(String dn)         { this.displayName = dn; }
    public String getPhoneNumber()                  { return phoneNumber; }
    public void   setPhoneNumber(String phone)      { this.phoneNumber = phone; }
    public Gender getGender()                       { return gender; }
    public void   setGender(Gender gender)          { this.gender = gender; }
}
