package com.example.Assets.repository;

import com.example.Assets.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // НОВОЕ: Поиск пользователя по уникальному юзернейму
    Optional<User> findByUsername(String username);

    // НОВОЕ: Проверка существования юзернейма при регистрации
    boolean existsByUsername(String username);
}