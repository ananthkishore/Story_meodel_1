# StoryCraft AI

StoryCraft AI turns project context into editable user stories with acceptance criteria. The React client and Express API are separate workspaces; projects and stories are persisted in MongoDB, and Gemini is called only by the backend.

## Requirements

- Node.js 20 or newer and npm
- MongoDB (local or hosted)
- A Gemini API key for story generation

## Setup (Windows PowerShell)

This folder is the project root. Use these commands from `P:\new_model _techm` (do not add a `user-story-generator` subfolder):

```powershell
npm install
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
if (-not (Test-Path frontend\.env)) { Copy-Item frontend\.env.example frontend\.env }
$jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
(Get-Content backend\.env) -replace '^JWT_SECRET=.*$', "JWT_SECRET=$jwtSecret" | Set-Content backend\.env
```

Then open `backend\.env` and set:

- `MONGODB_URI` to a reachable MongoDB instance. The example uses local MongoDB at `mongodb://127.0.0.1:27017/storycraft-ai`; make sure the MongoDB service is running, or use your MongoDB Atlas connection string.
- `GEMINI_API_KEY` to your Gemini API key. The server can start without it, but story generation will return a configuration error until it is set.

The command above generates a private, local-only JWT secret in `backend\.env`. Do not commit `.env` files or share database/API credentials. `frontend\.env` can keep its default API URL for local development.

Start both the API and frontend:

```powershell
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`; Vite selects another port such as `5174` if that port is already in use), create an account, and create a project. The API listens on `http://localhost:5000`; its health check is `GET /api/health`.

If you change `backend\.env` while the backend is already running, stop and restart the backend so it loads the new configuration.

Run the production frontend build with:

```powershell
npm run build
```

Run services separately with `npm run dev:backend` and `npm run dev:frontend`. The backend reads its environment from `backend\.env`.

### Startup troubleshooting

- `JWT_SECRET must be set`: create `backend\.env` using the setup commands above, then restart the backend.
- MongoDB connection error: start your local MongoDB service or configure `MONGODB_URI` to a reachable MongoDB deployment.
- Vite reports that port `5173` is in use: open the alternate URL printed by Vite, or stop the other frontend dev server before restarting.

## Architecture

### Frontend

`frontend/src` contains React Router pages, reusable navigation and story/project components, the Axios API client, and the auth context. Tailwind utilities and `styles.css` provide the responsive SaaS dashboard UI. The token is stored in browser local storage and sent as a bearer token; the Gemini key is never included in the frontend.

### Backend

`backend/src` separates Express routes, controllers, Mongoose models, authentication/error middleware, database configuration, and the Gemini service. All project and story routes require a signed-in account. MongoDB records carry an owner reference, and handlers scope reads and writes to that account. The generation endpoint validates structured AI output before persisting stories.

## API

All responses use `{ "success": boolean, "data": ... }` or `{ "success": false, "error": "..." }`. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current account |
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List owned projects |
| GET | `/api/projects/:id` | Get project and its stories |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project and its stories |
| POST | `/api/stories/generate` | Generate and save stories with Gemini |
| GET | `/api/stories/project/:projectId` | List stories in a project |
| GET | `/api/stories/:id` | Get a story |
| PUT | `/api/stories/:id` | Update a story |
| DELETE | `/api/stories/:id` | Delete a story |
| POST | `/api/stories/:id/regenerate` | Regenerate one story with Gemini |

Generation accepts project details or an existing `projectId`, plus `count` (3–20), priority focus, complexity, format, `includeAcceptanceCriteria`, and `includeEdgeCases`. Set `replaceExisting: true` to replace the current project story set after a successful AI response. Generation is rate-limited per API process.

## Notes

Account authentication is required. Passwords are hashed with bcrypt; configure a private MongoDB instance and use a strong JWT secret before deploying. Gemini generation requires a valid API key and network access. The API reports provider/configuration errors rather than returning synthetic stories.
