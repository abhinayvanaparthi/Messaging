# Real-Time Messaging Platform

A full-stack, real-time messaging application built with Next.js (App Router), Express.js, Socket.io, and MongoDB with Mongoose. The platform features token-based authentication via JSON Web Tokens (JWT) and bcrypt, secure WebSocket connections with handshake authentication, participant-restricted messaging channels, live online status indicators, authenticated file sharing with inline image previews and PDF downloads, in-place message editing and deletion, user search, and server-side AES-256 message encryption at rest using Crypto-JS.

---

## Live Demo

- **Web Application:** [https://messaging-frontend-kwjk.onrender.com/login](https://messaging-frontend-kwjk.onrender.com/login)

> [!NOTE]
> The live application is hosted on Render's free tier. Inactive web services spin down and can take up to a minute to wake up on the first request. The root URL (`/`) currently displays the default Next.js starter page, so please navigate directly to `/login` to access the chat application.

---

## Verified Features

- **Authentication & Authorization:** Secure user registration and login with `bcryptjs` password hashing (salt cost 10) and JWT signing. Route protection enforced via Bearer tokens on REST APIs and handshake authentication on Socket.io.
- **Strict Participant Authorization:** All conversation and message operations strictly verify participant membership before allowing access, returning HTTP 403 for unauthorized users.
- **Real-Time Direct Messaging:** Bi-directional messaging powered by Socket.io rooms and verified user socket bindings with immediate multi-client synchronization.
- **Live Online Presence Indicators:** Real-time presence indicators powered by the backend's `onlineUsers` socket broadcast:
  - Material UI `<Badge>` displaying a green dot (`#44b700`) on user avatars when online and a grey dot (`#bdbdbd`) when offline in the conversation sidebar.
  - Live "Online" / "Offline" status display for the other participant in the chat header.
  - Automatically synchronizes across page reloads and socket reconnections.
- **Secure File Sharing (Frontend & Backend):**
  - **Client File Attachment:** Paperclip button in `MessageInput.tsx` with a hidden file selector supporting JPEG, PNG, GIF, WebP images and PDF documents.
  - **Client-Side Validation:** Blocks files exceeding 5 MB (`MAX_FILE_SIZE`) or invalid file types before upload with clear error alerts.
  - **Preview Chip:** Displays an MUI `<Chip>` with the file name, formatted file size (in MB), and a remove button before sending.
  - **Upload State:** Displays an inline `<CircularProgress>` spinner and disables inputs during upload.
  - **Inline Media Rendering:** Fetches protected files via authenticated Blob streaming:
    - Images render inline with sensible max dimensions and an interactive click-to-open lightbox `<Dialog>` preview with a download button.
    - PDFs render as styled document cards with `PictureAsPdfIcon`, file name, and a direct download link.
    - Automatic Blob URL cleanup (`URL.revokeObjectURL`) on unmount to prevent browser memory leaks.
- **Real-Time Sidebar Previews:** The conversation sidebar listens for incoming messages, displays a generic `"📎 Attachment"` label for file messages, and automatically bubbles the most recently active conversation to the top.
- **Message Editing & Deletion:** Real-time right-click context menu in the chat window allowing message authors to edit or delete their own messages, synchronizing instantly across room participants. (Pure file attachments disable text-editing while maintaining deletion capability.)
- **Paginated Message History:** Chronological message retrieval with page-based pagination (20 messages per batch).
- **Server-Side Encryption at Rest:** Automatic AES-256 encryption of message content before saving to MongoDB via Mongoose `pre("save")` hooks, and server-side decryption prior to client response.
- **Multi-Tier Rate Limiting:** Global rate limiting on `/api` (100 requests / 15 minutes) and specialized rate limiting on `/api/auth` (20 requests / 15 minutes) to protect against brute-force attacks.
- **Secure File Upload Pipeline:** Multer disk storage restricted to JPEG, PNG, GIF, WebP images and PDF documents with a 5MB size limit and randomized 32-character hex storage filenames. Media files are served through an authenticated route with `X-Content-Type-Options: nosniff` headers.
- **Group Conversation Management (Backend):** Full REST API suite for creating group chats, adding/removing members, leaving groups, renaming groups, and transferring administration rights.
- **User Discovery:** Regex-sanitized search endpoint to find users by name or email while excluding the current authenticated user.

---

## Tech Stack

### Frontend (`Frontend/chat-app`)
- **Framework:** [Next.js](https://nextjs.org/) 16.1.6 (App Router)
- **UI & Components:** [React](https://react.dev/) 19.2.3, [Material UI (MUI)](https://mui.com/) v7.3.9, Emotion, [Tailwind CSS](https://tailwindcss.com/) v4
- **Real-Time Client:** [Socket.io-client](https://socket.io/) v4.8.3
- **HTTP Client:** [Axios](https://axios-http.com/) v1.13.6
- **Token Decoding:** [jwt-decode](https://github.com/auth0/jwt-decode) v4.0.0
- **Language:** TypeScript 5

### Backend (`Backend`)
- **Runtime & Server:** [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/) v5.2.1
- **Database & ODM:** [MongoDB](https://www.mongodb.com/), [Mongoose](https://mongoosejs.com/) v9.2.3
- **Real-Time Server:** [Socket.io](https://socket.io/) v4.8.3
- **Security & Cryptography:** `bcryptjs` v3.0.3, `jsonwebtoken` v9.0.3, `crypto-js` v4.2.0, `cors` v2.8.6
- **Rate Limiting:** `express-rate-limit` v8.3.0
- **File Handling:** `multer` v2.1.1
- **Configuration:** `dotenv` v17.3.1

---

## Architecture & Directory Structure

```text
Project Messaging/
├── .env.example                       # Root reference environment template
├── .gitignore                         # Comprehensive ignore rules (.env*, uploads/, node_modules/, etc.)
├── README.md                          # Repository documentation
├── Backend/                           # Express REST API & Socket.io WebSocket server
│   ├── .env.example                   # Backend environment template
│   ├── config/
│   │   ├── db.js                      # MongoDB connection handler
│   │   └── multer.js                  # Multer diskStorage with type/size validation & randomized filenames
│   ├── controllers/
│   │   ├── authController.js          # User registration & login with input validation & JWT issuance
│   │   ├── conversationController.js  # 1-on-1 & group conversation CRUD with participant checks
│   │   ├── messageController.js       # Message CRUD, file uploads, pagination, reactions, in-memory decrypted search
│   │   └── userController.js          # ReDoS-safe user search handler
│   ├── middleware/
│   │   ├── authMiddleware.js          # JWT authentication middleware (header & query support)
│   │   └── rateLimiter.js             # General API and auth-specific rate limiters
│   ├── models/
│   │   ├── Conversation.js            # Conversation schema (participants, lastMessage, group metadata)
│   │   ├── Message.js                 # Message schema with AES pre-save encryption hook & file fields
│   │   └── User.js                    # User schema (credentials, online status, timestamps)
│   ├── routes/
│   │   ├── authRoutes.js              # /api/auth routes with authLimiter
│   │   ├── conversationRoutes.js      # /api/conversations routes (protected)
│   │   ├── messageRoutes.js           # /api/messages routes with Multer error handling (protected)
│   │   └── userRoutes.js              # /api/users routes (protected)
│   ├── utils/
│   │   └── encryption.js              # CryptoJS AES encrypt/decrypt utility
│   ├── index.js                       # Server entry point with startup validation & authenticated Socket.io
│   ├── package.json                   # Backend dependencies and scripts
│   └── socketTest.js                  # CLI utility for testing authenticated socket connections
└── Frontend/
    ├── .env.example                   # Frontend environment template
    └── chat-app/                      # Next.js App Router client application
        ├── app/
        │   ├── chat/page.tsx          # Main chat interface (Sidebar + ChatWindow)
        │   ├── login/page.tsx         # User login page
        │   ├── register/page.tsx      # User registration page
        │   ├── search/page.tsx        # User search & conversation creation page
        │   ├── layout.tsx             # Root layout with MUI theme, AuthProvider, ChatProvider
        │   └── page.tsx               # Root page (starter template)
        ├── components/
        │   ├── ChatWindow.tsx          # Message stream, chat header with online status, context menu, editor
        │   ├── ConversationSidebar.tsx # Conversation list with online status badges & real-time updates
        │   ├── FileAttachment.tsx      # Authenticated Blob media loader, inline images, lightbox, PDF cards
        │   ├── MessageInput.tsx        # Text input, paperclip file picker, preview chip, upload handler
        │   ├── ProtectedRoute.tsx      # Client-side authentication guard
        │   └── CommonLink.tsx          # Next.js navigation anchor wrapper
        ├── context/
        │   ├── AuthContext.tsx        # Token persistence, auto-reconnect, auth state, socket logout cleanup
        │   └── ChatContext.tsx        # Active conversation & online users state provider
        ├── services/
        │   ├── api.ts                 # Axios instance with automatic JWT Bearer token interceptor
        │   ├── authService.ts         # Authentication HTTP service
        │   ├── conversationService.ts # Conversation HTTP service
        │   ├── messageService.ts      # Message CRUD & multipart file upload HTTP service
        │   └── userService.ts         # User search HTTP service
        ├── socket/
        │   └── socket.ts              # Socket.io client with handshake auth & onlineUsers subscription
        ├── next.config.ts             # Next.js configuration with environment-driven API rewrites
        ├── tailwind.config.js         # Tailwind CSS configuration (preflight disabled)
        └── package.json               # Frontend dependencies and scripts
```

### Component Interconnection Flow

1. **Authentication:** User enters credentials on `/login`. `authController.loginUser` validates inputs, checks password with `bcrypt.compare`, signs a JWT using `process.env.JWT_SECRET`, and returns it. `AuthContext` stores the token in `localStorage`.
2. **Authenticated WebSocket Handshake:** `AuthContext` calls `connectSocket(userId, token)`. Socket.io initiates a connection sending `auth: { token }`. The server's `io.use` middleware verifies the JWT against `process.env.JWT_SECRET`. Sockets without a valid token are rejected immediately.
3. **Online Status Broadcasting:**
   - When a socket connects, the server associates the user ID with the socket in `onlineUsers` and emits `onlineUsers` to all connected clients.
   - `ChatContext` subscribes via `subscribeToOnlineUsers` in `socket.ts`, maintaining the list of online user IDs in shared state.
   - `ConversationSidebar` displays a green badge for online participants and grey for offline.
   - `ChatWindow` displays "Online" or "Offline" text alongside the avatar in the header.
   - When a socket disconnects, the server removes the entry and re-broadcasts the updated `onlineUsers` array.
4. **Room Subscription:** Selecting a chat in `ConversationSidebar` prompts `ChatWindow` to emit `joinConversation` with `conversationId`. The server verifies that the socket's authenticated user is an active participant before allowing the socket into the room.
5. **Sending Text Messages:**
   - Client sends an HTTP `POST /api/messages` with `conversationId` and `content`.
   - `messageController.sendMessage` verifies that `req.user.id` is a participant in the conversation.
   - The message is stored in MongoDB, automatically encrypted via the `Message.pre("save")` hook.
   - The controller broadcasts `newMessage` (containing decrypted content) to the conversation room and directly to connected participant sockets.
6. **Sending File Attachments:**
   - User attaches an image or PDF via the paperclip icon in `MessageInput.tsx`.
   - The client validates file extension, MIME type, and checks that file size does not exceed 5 MB (`5 * 1024 * 1024` bytes).
   - Sending sends a multipart `POST /api/messages/file` with `file` and `conversationId`.
   - Multer checks MIME and extension, stores the file with a random 32-character hex name in `Backend/uploads/`, and creates a message document with `fileUrl: "/uploads/<filename>"` and `content: "[File Attachment]"`.
   - The backend emits `newMessage` to the conversation room.
   - In `ChatWindow.tsx`, `<FileAttachment>` fetches the file from `${BACKEND_URL}${fileUrl}` with `Authorization: Bearer <token>`, converts it to a client-side Blob URL, and renders either an inline image (with click-to-open lightbox modal) or a PDF download card. Object URLs are revoked on unmount.
7. **Editing and Deleting:**
   - Message authors right-click their messages in `ChatWindow` to trigger edit or delete.
   - The client submits an HTTP `PUT` or `DELETE` request, and upon success, emits `editMessage` or `deleteMessage` over Socket.io.
   - The server verifies participant status and broadcasts `messageEdited` or `messageDeleted` to the room.

---

## Setup & Running Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local server or MongoDB Atlas cluster)
- `npm`

### 1. Installation

Install backend dependencies:
```bash
cd Backend
npm install
```

Install frontend dependencies:
```bash
cd ../Frontend/chat-app
npm install
```
*(Note: Do not install dependencies in the parent `Frontend/` directory; the active Next.js app is located in `Frontend/chat-app/`.)*

### 2. Environment Configuration

Create `Backend/.env`:
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/messaging
JWT_SECRET=your_strong_random_jwt_secret_here
MESSAGE_SECRET=your_cryptojs_aes_secret_key_here
ALLOWED_ORIGINS=http://localhost:3000
MAX_FILE_SIZE=5242880
```

Create `Frontend/chat-app/.env.local`:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

#### Environment Variables Reference

| Variable | Scope | Required | Default Fallback | Purpose |
|---|---|---|---|---|
| `PORT` | Backend | No | `5000` | Server listen port |
| `MONGO_URI` | Backend | **Yes** | *None (exits on startup if missing)* | MongoDB connection string |
| `JWT_SECRET` | Backend | **Yes** | *None (exits on startup if missing)* | Secret key for signing and verifying JWTs |
| `MESSAGE_SECRET` | Backend | **Yes** | *None (exits on startup if missing)* | Secret key for CryptoJS AES-256 message encryption |
| `ALLOWED_ORIGINS` | Backend | No | `http://localhost:3000` | Comma-separated CORS allowed origins |
| `FRONTEND_URL` | Backend | No | `http://localhost:3000` | Fallback single CORS origin |
| `MAX_FILE_SIZE` | Backend | No | `5242880` (5MB) | Maximum allowed file upload size in bytes |
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | **Yes** | `http://localhost:5000` | Backend API and Socket.io server URL |

### 3. Running Development Servers

Start the Backend (runs on port 5000):
```bash
cd Backend
npm run dev
```

In a separate terminal, start the Frontend (runs on port 3000):
```bash
cd Frontend/chat-app
npm run dev
```

Access the application in your browser at [http://localhost:3000/login](http://localhost:3000/login).

---

## REST API Routes & Socket.io Events

### REST API Endpoints

#### Authentication (`/api/auth`) — Rate limited to 20 req/15min
- `POST /api/auth/register` - Register a new user. Body: `{ name, email, password }`.
- `POST /api/auth/login` - Authenticate user credentials and receive JWT. Body: `{ email, password }`.

#### Users (`/api/users`)
- `GET /api/users?search=<query>` - Search users by name or email (Auth required). Excludes requesting user and sanitizes regex queries.

#### Conversations (`/api/conversations`)
- `POST /api/conversations/` - Create or retrieve 1-on-1 conversation (Auth required). Body: `{ userId }`.
- `GET /api/conversations/` - List user's conversations with unread message counts (Auth required).
- `POST /api/conversations/group` - Create group conversation (Auth required). Body: `{ groupName, participants: string[] }`.
- `PUT /api/conversations/group/add/:conversationId` - Add group member (Auth required, Admin only). Body: `{ userId }`.
- `PUT /api/conversations/group/remove/:conversationId` - Remove group member (Auth required, Admin only). Body: `{ userId }`.
- `PUT /api/conversations/group/leave/:conversationId` - Leave group conversation (Auth required, Participant only).
- `PUT /api/conversations/group/rename/:conversationId` - Rename group (Auth required, Admin only). Body: `{ groupName }`.
- `PUT /api/conversations/group/admin/:conversationId` - Transfer admin role (Auth required, Admin only). Body: `{ newAdminId }`.

#### Messages (`/api/messages`)
- `POST /api/messages/` - Send a text message (Auth required, Participant only). Body: `{ conversationId, content }`.
- `GET /api/messages/:conversationId?page=<page>` - Get paginated messages (Auth required, Participant only).
- `PUT /api/messages/read/:conversationId` - Mark conversation messages as read (Auth required, Participant only).
- `PUT /api/messages/edit/:messageId` - Edit message content (Auth required, Author only). Body: `{ content }`.
- `DELETE /api/messages/delete/:messageId` - Delete a message (Auth required, Author only).
- `POST /api/messages/react/:messageId` - Toggle reaction emoji (Auth required, Participant only). Body: `{ emoji }`.
- `POST /api/messages/file` - Upload file attachment (Auth required, Participant only, multipart `file`, 5MB limit).
- `GET /api/messages/search/:conversationId?query=<text>` - Search messages in conversation (Auth required, Participant only).

#### Protected Media (`/uploads`)
- `GET /uploads/:filename` - Access uploaded files (Auth required via Bearer header or `?token=` query param). Sets `X-Content-Type-Options: nosniff`, `Content-Disposition: inline` for images, and `attachment` for PDFs.

---

### Socket.io Events

| Event Name | Direction | Auth Required | Payload | Description |
|---|---|---|---|---|
| `connection` | Client -> Server | **Yes** (Handshake) | Connection request | Validates JWT in `socket.handshake.auth.token`. Sockets without a valid token are rejected. |
| `join` | Client -> Server | **Yes** | None | Registers verified socket in `onlineUsers` map; marks `isOnline: true` in DB. |
| `onlineUsers` | Server -> All Clients | **Yes** | `userIds: string[]` | Broadcasts active online user IDs to all connected clients upon connect or disconnect. |
| `joinConversation` | Client -> Server | **Yes** | `conversationId: string` | Verifies user is a conversation participant before joining room. |
| `editMessage` | Client -> Server | **Yes** | `{ conversationId, updatedMessage }` | Verifies participant status; broadcasts `messageEdited` to room. |
| `messageEdited` | Server -> Room Clients | **Yes** | `updatedMessage: object` | Delivers edited message payload to room participants. |
| `deleteMessage` | Client -> Server | **Yes** | `{ conversationId, messageId }` | Verifies participant status; broadcasts `messageDeleted` to room. |
| `messageDeleted` | Server -> Room Clients | **Yes** | `messageId: string` | Delivers deleted message ID to room participants. |
| `typing` | Client -> Server | **Yes** | `{ conversationId }` | Verifies participant status; broadcasts `typing` with verified `userId` to room. |
| `stopTyping` | Server -> Room Clients | **Yes** | `{ userId: string }` | Emitted automatically after 2 seconds of typing inactivity. |
| `newMessage` | Server -> Client | **Yes** | `message: object` | Emitted by HTTP controller to conversation room and participants (handles text and file messages). |
| `disconnect` | Client -> Server | **Yes** | None | Cleans up socket from `onlineUsers`; marks user offline in DB and emits updated `onlineUsers`. |

---

## Security Implementation & Architecture Details

1. **JWT Authentication & Startup Verification:**
   - JWT tokens are signed using `process.env.JWT_SECRET` with 7-day expiration.
   - The backend enforces startup verification: if `JWT_SECRET`, `MONGO_URI`, or `MESSAGE_SECRET` are missing, the server exits immediately with a fatal error.
   - Both HTTP requests (`authMiddleware.js`) and Socket.io connections (`io.use`) strictly enforce token verification.
2. **Participant Authorization on All Operations:**
   - Every message route (`sendMessage`, `getMessages`, `markMessagesAsRead`, `sendFileMessage`, `searchMessages`) and every room-based socket event verifies that `req.user.id` / `socket.userId` belongs to `conversation.participants`. Unauthorized requests receive HTTP 403.
3. **Multi-Tier Rate Limiting & Input Validation:**
   - Global rate limiting protects `/api` (100 req / 15 min).
   - Dedicated `authLimiter` protects `/api/auth` (20 req / 15 min) against brute-force attacks.
   - Behind reverse proxies (e.g., Render), `app.set("trust proxy", 1)` is enabled to prevent `ERR_ERL_PERMISSIVE_TRUST_PROXY` validation errors.
   - User inputs for registration, login, and messaging are validated for format, length, and non-empty values. User queries in search endpoints are escaped against ReDoS.
4. **Restricted File Upload Pipeline:**
   - Multer is restricted to JPEG, PNG, GIF, WebP images and PDF documents, verified by both MIME type and file extension.
   - File size is capped at 5MB (`MAX_FILE_SIZE`). Stored files use randomized filenames (`crypto.randomBytes(16)`).
   - Uploaded files are served from an authenticated `/uploads` route with `X-Content-Type-Options: nosniff`.
   - The frontend streams media via authenticated `fetch` with the user's JWT token, creates a local Blob URL, and releases it on unmount.
5. **Crypto-JS Encryption at Rest (Honest Architecture Disclosure):**
   - **Server-Side Only:** Encryption and decryption occur exclusively on the backend via Mongoose `pre("save")` hooks and controller methods.
   - **Key Location:** The encryption key (`process.env.MESSAGE_SECRET`) lives exclusively on the server. The client has no access to this key.
   - **Not End-to-End Encryption:** Because the server decrypts messages before sending responses, this is **Encryption at Rest** in the database, not End-to-End Encryption (E2EE).
   - **Limitation:** In the `Conversation` model, `lastMessage` stores the plaintext preview string to allow quick sidebar rendering without decrypting conversation documents.

---

## Known Limitations & Architectural Trade-offs

- **Ephemeral File Storage on Free Tier Hosting:** Uploaded files are stored on the server's local disk in `Backend/uploads/`. When deployed on free-tier hosting like Render, the filesystem is ephemeral: files are permanently lost whenever the service restarts, redeploys, or spins down from inactivity. In production, this requires an object storage service such as AWS S3, Google Cloud Storage, or Cloudinary.
- **Generic Conversation Preview for Files:** In `ConversationSidebar`, file uploads display a generic `"📎 Attachment"` label because the backend stores `lastMessage: "[File Attachment]"` without preserving original filename metadata on the conversation document.
- **Server-Side Encryption at Rest vs E2EE:** Encryption is performed server-side with AES-256 (`CryptoJS`) using a server environment variable (`MESSAGE_SECRET`). It protects data at rest in MongoDB against database exposure, but does not provide zero-knowledge end-to-end encryption between clients.
- **Frontend Group Chat UI:** The backend implements a complete suite of REST endpoints for group chat creation, member management, and role assignment (`conversationController.js`), but the frontend UI currently only exposes one-on-one direct messaging and user search.
- **Default Next.js Root Page:** The root route `/` contains the default Next.js starter page instead of an automatic redirect to `/login` or `/chat`. Users must navigate directly to `/login`.

---

## Screenshots & Demo Placeholder

```text
[ Screenshots / Demo GIF ]
- User Registration & Login (/login)
- Active Conversation with Live Online Status Indicators and Real-Time Chat
- In-Chat File Sharing with Inline Image Lightbox and PDF Download Cards
- Right-Click Context Menu for In-Place Message Edit and Delete
- User Search & New Conversation Initiation (/search)
```

---

## Future Work

- [ ] **Cloud Object Storage:** Migrate local Multer disk storage to an S3-compatible cloud bucket or Cloudinary to persist media files across container restarts.
- [ ] **Frontend Group Chat UI:** Build modals for group creation and participant management using the existing backend group REST endpoints.
- [ ] **Frontend Root Routing:** Add an automated redirect from `/` to `/login` or `/chat` in `app/page.tsx`.
- [ ] **End-to-End Encryption (E2EE):** Migrate message encryption to client-side Web Crypto API or Signal Protocol so plaintext is never exposed to the server.
- [ ] **Cleanup:** Remove the deprecated parent `Frontend/package.json` and its unused `@mantine/core` dependencies.
