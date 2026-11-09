# Gestione globale degli errori HTTP

## File prodotti

| File | Scopo |
|------|-------|
| `app-error.model.ts`   | Classe `AppError` + type guard `isAppError()` |
| `error.interceptor.ts` | Trasforma `HttpErrorResponse` → `AppError`, mostra notify |
| `auth.interceptor.ts`  | Aggiunge token, gestisce 401/refresh/logout (aggiornato) |
| `zserver.service.ts`   | CRUD dataset, zero handleError (semplificato) |

---

## 1. Registrazione in app.config.ts

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor }  from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        authInterceptor,   // 1° — inietta token, gestisce 401/refresh/logout
        errorInterceptor,  // 2° — trasforma tutti gli altri errori in AppError
      ])
    ),
    // ...
  ]
};
```

L'ordine è importante: `authInterceptor` deve essere **prima** per intercettare
il 401 grezzo prima che `errorInterceptor` lo processi.

---

## 2. Come adattare gli altri servizi esistenti

Qualsiasi servizio che fa `catchError(this.handleError)` può essere semplificato
rimuovendo completamente il catch — ci pensa `errorInterceptor`.

```typescript
// PRIMA (ogni servizio aveva il suo handleError)
return this.http.get('/api/foo').pipe(
  catchError(this.handleError)
).toPromise();

// DOPO (niente catchError, errorInterceptor gestisce tutto)
return this.http.get('/api/foo').toPromise();
```

---

## 3. Gestione specifica nel componente

Se un componente ha bisogno di reagire diversamente per categoria:

```typescript
import { AppError, isAppError } from '@core/models/app-error.model';

// Con Observable
this.mioServizio.save(data).subscribe({
  next: () => notify('Salvato', 'success'),
  error: (err) => {
    if (!isAppError(err)) return;           // notify già mostrato da errorInterceptor
    if (err.category === 'validation') {
      this.formErrors = parseValidation(err);  // gestione extra
    }
    // Per tutti gli altri: il notify è già stato mostrato, non fare nulla
  }
});

// Con Promise (CustomStore DevExtreme)
this.store.insert(data).catch((err: AppError) => {
  if (err.category === 'validation') {
    this.highlightErrors(err);
  }
  // notify già mostrato automaticamente
});
```

> **Nota:** `errorInterceptor` mostra **sempre** il notify. Se non vuoi
> il notify automatico per certe chiamate, aggiungi un header custom alla
> richiesta e controlla in `errorInterceptor`:
>
> ```typescript
> // Nel servizio
> this.http.post(url, body, { headers: { 'X-Silent-Error': 'true' } })
>
> // In errorInterceptor, prima di showNotify():
> if (req.headers.has('X-Silent-Error')) return throwError(() => appError);
> ```

---

## 4. Comportamento dev vs prod

| Situazione | Development | Production |
|---|---|---|
| Notify messaggio | Dettaglio tecnico (method, url, status, body) troncato a 300 chars | Messaggio generico localizzato |
| Console | Sempre dettaglio completo | Sempre dettaglio completo |
| `AppError.devDetail` | Valorizzato | Stringa vuota |
| 400 / 422 | Messaggio server + dettaglio | Solo messaggio server |
| 401 | Passa a authInterceptor (refresh → logout) | Idem |

---

## 5. Flusso completo

```
Request HTTP
    │
    ▼
authInterceptor
    ├── Aggiunge Bearer token
    ├── 401 + refreshToken disponibile → refresh → retry
    ├── 401 + refresh fallisce → auth.logout()
    └── Tutto il resto → passa a errorInterceptor
    │
    ▼
errorInterceptor
    ├── AppError già costruito → passa (safety guard)
    ├── 401 → passa (authInterceptor ha già fatto logout)
    ├── Ogni altro HttpErrorResponse →
    │       buildAppError()   → AppError con categoria + messaggio
    │       showNotify()      → notifica DevExtreme all'utente
    │       console.error()   → log tecnico completo
    │       throwError()      → AppError arriva al chiamante
    └── Errori non-HTTP → passa inalterato
    │
    ▼
Servizio / Componente
    └── Riceve AppError (notify già mostrato)
        └── Gestione opzionale per categoria (validation, ecc.)
```
