# Hotel

Hotel management platform built as Spring Boot microservices with a React (Vite + TypeScript) frontend, secured by Keycloak.

## Stack

| Service | Host port | Description |
|---|---|---|
| frontend | 5173 | React UI (served by nginx) |
| api-gateway | 8180 | Single entry point for the frontend |
| config-server | 8888 | Centralised configuration |
| discovery-service | 8889 | Eureka service registry |
| chambre-service | 8091 | Rooms |
| stock-service | 8082 | Stock / inventory |
| reservation-service | 8083 | Reservations, email notifications |
| client-service | 8084 | Clients (Cloudinary uploads) |
| rh-service | 8086 | Human resources |
| payment-service | 8087 | Stripe payments |
| user-service | 3001 | Users (Node.js + MongoDB) |
| keycloak | 9999 | Auth, realm `hotel` (imported from `keycloak/hotel-realm.json`) |
| rabbitmq | 5673 / 15673 | Event bus / management UI |
| mongodb | 27018 | User-service database |
| zipkin | 9411 | Distributed tracing |

## Getting started

1. Copy the environment templates and fill in your keys:
   ```
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```
2. Start everything:
   ```
   docker compose up -d --build
   ```
3. Open http://localhost:5173.

Access is role-based (admin, manager, staff, client) through Keycloak realm roles.
