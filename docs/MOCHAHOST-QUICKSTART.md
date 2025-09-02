# Mochahost Node.js API Quickstart & Onboarding Guide

## 🚀 Quickstart for New APIs

1. **Clone the repo and install dependencies:**
   ```bash
   git clone <repo-url>
   cd <project>
   npm install
   ```
2. **Copy `.env.example` to `.env` in the project root.**
   - Fill in all required values (DB, JWT, etc).
3. **Develop in `src/`, build to `dist/`:**
   - All source code lives in `src/`.
   - Build with `npm run build` (outputs to `dist/`).
4. **Run locally:**
   ```bash
   npm run dev
   # or
   npm run dev:watch
   ```
5. **Deploy using the provided script:**
   ```bash
   npm run deploy:mochahost
   # Then, on the server (Plesk):
   npm install --production
   npm run build
   ```
6. **Test endpoints:**
   - `/` (root)
   - `/health`
   - `/auth/login` (get JWT)
   - All protected endpoints (use JWT)

---

## Project Structure

```
your-app/
├── .env                # Environment variables (never in dist/)
├── src/                # All TypeScript source code
│   ├── app.ts          # Main app entry
│   ├── api/            # Routers (auth, buckets, files, folders)
│   ├── middlewares/    # Auth, error handling, etc
│   ├── models/         # Sequelize models
│   └── ...
├── dist/               # Compiled JS (never edit)
├── package.json
├── tsconfig.json
├── web.config          # IIS/iisnode config
└── ...
```

---

## Environment Variables (`.env`)
- Always keep `.env` in the project root (never in `dist/`).
- Example:
  ```env
  NODE_ENV=production
  DB_HOST=...
  DB_NAME=...
  DB_USER=...
  DB_PASSWORD=...
  DB_PORT=1433
  JWT_SECRET=your-jwt-secret
  JWT_EXPIRES_IN=1h
  ```
- Never commit `.env` to version control.

---

## Environment Variable Loading
- In your code, always load `.env` from the project root:
  ```ts
  import dotenv from 'dotenv';
  import path from 'path';
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  ```
- This works for both local dev and production (when running from `dist/`).
- **Never copy `.env` into `dist/`.**

---

## web.config for IIS/iisnode
- Place `web.config` in the project root.
- Example:
  ```xml
  <configuration>
    <system.webServer>
      <iisnode loggingEnabled="false" devErrorsEnabled="true" nodeProcessCommandLine="C:\Program Files\nodejs\node.exe"/>
      <handlers>
        <add name="iisnode" path="*.js" verb="*" modules="iisnode"/>
      </handlers>
      <rewrite>
        <rules>
          <rule name="MainApp">
            <action type="Rewrite" url="dist/index.js"/>
          </rule>
        </rules>
      </rewrite>
    </system.webServer>
  </configuration>
  ```
- This routes all requests to your main app (`dist/index.js`).
- Disables iisnode logging (fixes permission errors).
- Enables dev errors for easier debugging.

---

## TypeScript Build & tsconfig.json
- Always output your main app entry file to `dist/` (not `dist/src/`).
- Example `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "es2019",
      "module": "commonjs",
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true
    },
    "include": ["src"]
  }
  ```
- After building, your entry should be `dist/index.js` or `dist/app.js`.

---

## CRITICAL: Use a Single Shared Sequelize Instance
- **Never create multiple Sequelize instances.**
- Initialize Sequelize once in your main app (e.g., `app.ts`):
  ```ts
  import { Sequelize } from 'sequelize';
  import initializeModels from './models';
  const sequelize = new Sequelize(/* ...config... */);
  const db = initializeModels(sequelize);
  ```
- Pass the initialized `db` to all routers, middleware, and scripts:
  ```ts
  import createAuthRouter from './api/auth';
  app.use('/auth', createAuthRouter(db));
  ```
- For scripts, initialize `sequelize` and `db` at the top before using any models.
- **Symptoms of the anti-pattern:**
  - HTML 500 errors from IIS (not JSON), even when other endpoints work.
  - Fatal startup crashes not caught by Express error handlers.
  - Inconsistent database state or missing models in some routes.

---

## JWT Authentication
- Always use a consistent JWT payload (e.g., `{ userId, username }`).
- Middleware should extract `userId` from the token and look up the user in the DB.
- Example:
  ```ts
  // Signing
  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  // Verifying
  const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
  const user = await db.User.findByPk(payload.userId);
  ```
- If the payload and middleware are mismatched, protected endpoints will always 401.

---

## Error Handling & Debugging
- **Never throw exceptions at the top level in routers or middleware.** Always return errors as JSON.
- Add a global error handler at the end of your app:
  ```ts
  app.use((err, req, res, next) => {
    res.status(500).json({ status: 'error', error: err.message || 'Unknown error' });
  });
  ```
- For fatal startup errors (e.g., router import fails), wrap router mounting in a try/catch and expose the error in a debug endpoint or global handler.
- Remove debug code before going live.

---

## Deployment Steps (Summary)
1. **Build:** `npm run build`
2. **Deploy:** `npm run deploy:mochahost`
3. **On server:** `npm install --production && npm run build`
4. **Restart IIS app in Plesk**
5. **Test all endpoints**

---

## Troubleshooting Checklist
- `.env` is in the project root (not in `dist/`)
- Main entry file is in `dist/` and matches `web.config`
- Only one Sequelize instance is used
- JWT payload and middleware are consistent
- All endpoints return JSON errors (not HTML 500)
- Remove debug output before production

---

## Security Notes
- Never commit `.env` to version control.
- Use strong, unique secrets for DB and JWT.
- Rotate secrets regularly.

---

**This guide is designed for fast onboarding and reliable deployment of Node.js APIs to Mochahost. Follow it step-by-step to avoid common pitfalls and get your API live quickly.**
