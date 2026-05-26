package com.example.Assets.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    // Принимаем email ИЛИ username — убираем @Email валидацию
    @NotBlank(message = "Login field is required")
    @Size(max = 255)
    private String email;   // поле называется email, но принимает и username

    @NotBlank(message = "Password is required")
    private String password;

    public String getEmail()              { return email; }
    public void   setEmail(String email)  { this.email = email; }
    public String getPassword()           { return password; }
    public void   setPassword(String pw)  { this.password = pw; }
}
