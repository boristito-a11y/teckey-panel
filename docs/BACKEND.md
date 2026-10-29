# Conectar TECKEY con Spring Boot

Por defecto el panel usa datos de demostración en memoria. Para usar el backend real:

1. Copia `.env.example` como `.env.local`.
2. Ajusta `VITE_API_URL` si Spring Boot no corre en `http://localhost:8080`.
3. Reinicia `npm run dev`.

La barra lateral muestra "Conectado a Spring Boot" cuando `VITE_USE_MOCK=false`.

## Endpoints REST que lee el panel

Los JSON usan los mismos nombres de campo que los tipos de `src/lib/teckey-store.ts`.

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/profesores` | `[{ id, nombres, apellidos, dni, correo, celular, cardId }]` |
| GET | `/api/tarjetas` | `[{ id, code, uid, tech, status: "Activa" \| "Inactiva", professorId, registeredAt, note }]` |
| GET | `/api/accesos?limite=200` | `[{ id, datetime: "dd/MM/yyyy HH:mm", classroom, professorName, tag, result }]` |
| GET | `/api/solicitudes` | `[{ id, professorId, classroom, reason, requestedAt, duration, status, kind, week, day, blockIndex }]` |

`result` es `CONCEDIDO`, `FUERA DE HORARIO` o `DENEGADO`.

Habilita CORS para el origen del panel (por ejemplo `http://localhost:5180`):

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOriginPatterns("*").allowedMethods("*");
    }
}
```

## Tiempo real (WebSocket STOMP)

Cada vez que el lector RFID de un aula lee una tarjeta, publica la lectura en `/topic/accesos` con la misma forma que un elemento de `/api/accesos`. El Dashboard la muestra al instante en "Eventos en tiempo real" y en el "Lector RFID en vivo".

Dependencia: `spring-boot-starter-websocket`

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*");
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class AccesoService {
    private final SimpMessagingTemplate broker;
    private final AccesoRepository repo;

    public void registrarLectura(Acceso acceso) {
        repo.save(acceso);
        broker.convertAndSend("/topic/accesos", AccesoDTO.from(acceso));
    }
}
```

## Pendiente

Las acciones que modifican datos (asignar tarjeta, aprobar solicitud, abrir aula, etc.) todavía cambian solo el estado en memoria del navegador. El siguiente paso es que cada función de `actions` en `teckey-store.ts` llame también a su endpoint `POST`/`PUT`/`DELETE`.
