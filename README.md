# KEYED — запуск фронта и бэка

Два приложения:

| Папка | Роль | URL |
|-------|------|-----|
| `Assets` | Spring Boot API + PostgreSQL | http://localhost:8080 |
| `Assets-Frontend/keyed-vault-frontend` | React (Vite) UI | http://localhost:5173 |

Фронт ходит в бэк через **прокси Vite** (`/api` → `:8080`). Отдельный CORS настроен на бэке для `localhost:5173`.

---

## 1. База данных

```powershell
cd Assets
docker compose up -d
```

---

## 2. Бэкенд (Assets)

```powershell
cd Assets
pip install -r req.txt
.\mvnw.cmd spring-boot:run
```

Дождитесь в логе: `Access URL: http://localhost:8080`

Регистрация (один раз, Postman или curl):

```powershell
curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"you@test.com\",\"password\":\"password123\",\"displayName\":\"You\"}"
```

---

## 3. Фронтенд (Assets-Frontend)

**Новый терминал:**

```powershell
cd Assets-Frontend\keyed-vault-frontend
npm install
npm run dev
```

Откройте **http://localhost:5173** → войдите с email/паролем из регистрации.

---

## Схема

```
Браузер :5173  →  Vite proxy /api, /vault  →  Spring :8080  →  PostgreSQL (Docker)
```

---

## Частые ошибки

| Симптом | Решение |
|---------|---------|
| 401 на ledger/upload | Войти снова на :5173 |
| Cannot reach backend | Запустить `mvnw spring-boot:run` в `Assets` |
| Python / pHash error | `pip install -r req.txt` в `Assets` |
| Пустой ledger | Сначала загрузить файл в Workspace |
