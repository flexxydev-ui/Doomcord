# Doomcord — Next-Generation Social Communication Platform

Doomcord is a modern, high-fidelity social communication platform uniting real-time direct messaging, community servers with structured voice/text channels, social graph management, and signature 3D interactive Orbs built on a dark forest-green aesthetic.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and user experience decisions were confirmed through Phase 1 user interview questions and prompt constraints:

- **Persistence & Real-Time Sync**: Firebase Firestore and Firebase Authentication integration (`firebase-integration-rpc` workflow with `show_aistudio_ui` provisioning, hardened ABAC security rules, and reactive `onSnapshot` subscriptions).
- **Orbs Visual Spaces**: Interactive Three.js 3D Canvas featuring procedural floating sphere geometries, orbital particle simulations, custom glow shaders, and physics-influenced hover dynamics.
- **Voice & Stage Channels**: Real WebRTC peer-to-peer audio rooms featuring live HTML5 Web Audio API microphone volume analysis, speaking ring visualizers, mute/deafen controls, and stage hand-raising.
- **Message Read Status Tracking**: Explicit read receipts updating in real time when a recipient opens a direct message or channel, displaying double checkmarks and timestamp tooltips for the sender.

---

### 1. Overview & Core Concept

- **What It Does**: Doomcord delivers a digital home where users communicate in real time across four integrated pillars:
  1. **Friends System**: Search directory, real-time presence (Online, Idle, DND, Invisible), incoming/outgoing friend requests, blocking, and fast DM jump.
  2. **Direct Messaging & Group Chat**: One-to-one and group threads with real-time delivery, message editing, soft deletion, emoji reactions, image attachments with previews, pinned messages, typing indicators, and sender read status checkmarks.
  3. **Communities & Channels**: Discord-style server architecture with customized iconography, text and announcement channels, role-based access control (Owner, Admin, Moderator, Member), invite links, and live member rosters.
  4. **Signature Orbs**: Spatial interest realms (Gaming, Coding, Anime, Music, Art, Science) rendered as glowing 3D spheres with member counts, live discussion feeds, activity pulses, and customizable privacy (Public, Friends Only, Private).
- **Target Audience / Persona**: Gamers, developer collectives, creative communities, and friend circles seeking a focused, atmospheric, dark-mode-first alternative to chaotic legacy chat apps.
- **Key Value**: Cohesive, latency-free communication combined with visceral 3D spatial discovery, grounded in an authentic dark forest-green design language.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Authentication & Profile Setup**: Secure email/password and Google login via Firebase Auth, guiding users to customize their display name, avatar, bio, accent color, and initial presence status.
2. **Global Navigation Rail & Hub**: Leftmost compact rail allowing seamless switching between Direct Messages/Friends hub, Community servers, and the 3D Orbs Discovery Nexus.
3. **Conversations & Read Receipts**: Clicking a conversation loads historical messages with smooth scroll-to-bottom. Opening an unread conversation immediately dispatches a read-receipt event, turning single checkmarks into colored double checkmarks on the sender's client.
4. **Interactive 3D Orbs Discovery**: Users browse public and friend-shared Orbs on a dedicated canvas, hovering to trigger orbital acceleration and clicking to enter the Orb's dedicated social room.
5. **Real WebRTC Audio Channels**: Clicking a voice or stage channel prompts for microphone permissions, connects audio streams, and displays active speaker halos around user avatars with a collapsible bottom audio control dock.

#### Visual Identity & Theme
- **Color Palette (OKLCH Forest Green System)**:
  - Main Background: `oklch(0.2 0.03 160)` — deep atmospheric forest obsidian
  - Navigation Rail: `oklch(0.14 0.025 162)` — darkest grounded anchor
  - Channel / Sub-Panels: `oklch(0.17 0.028 161)` — structured secondary surface
  - Cards & Message Rows: `oklch(0.235 0.032 158)` — elevated cards with hairline border
  - Primary Text: `oklch(0.95 0.015 150)` — high-contrast crisp mint-white
  - Muted Text: `oklch(0.7 0.03 155)` — readable sage metadata
  - Brand Accents: Coral `oklch(0.72 0.16 32)` and Mint `oklch(0.85 0.12 165)`
  - Status Accents: Gold `oklch(0.84 0.14 85)` (idle), Sky `oklch(0.76 0.11 230)` (stage), Rose `oklch(0.72 0.15 355)` (DND/alerts), Moss `oklch(0.62 0.11 140)`
- **Typography & Hierarchy**:
  - Headings: `Bricolage Grotesque` (curated Google Font with distinctive personality and optical legibility).
  - Body Prose: `Figtree` (clean, geometric humanist sans for dense chat readability).
  - Code & Timestamps: Tabular numerals with monospace styling (`font-mono tabular-nums`).
- **Component Styling & Anti-Slop Restraint**:
  - Zero static pill boxes for metadata: dates, counts, and tags use subtle dot (`·`) dividers.
  - Single-elevation card depth with crisp 1px borders (`border-white/5` to `border-white/10`).
  - No decorative pulsating dots; presence indicators use solid status badges matching standard communication patterns.
  - Three-zone top navigation bar with breadcrumb context, title, and action controls.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Firebase Firestore & Auth with Real-Time Subscriptions**
  - *Chosen Approach*: Provision Firebase Firestore via `show_aistudio_ui` and `ProvisionFirebase` RPC. Structure documents with subcollections for messages and memberships, secured by hardened ABAC rules.
  - *Why*: Provides persistent multi-client synchronization, offline caching, and robust security rules without external database hosting hurdles.
  - *Alternatives Considered*: Local in-memory or SQLite was rejected because real-time multi-device collaboration is essential to Doomcord's social value.
- **Decision 2: Three.js WebGL Canvas for Signature Orbs with Procedural Textures**
  - *Chosen Approach*: Dedicated Three.js canvas utilizing `RoomEnvironment`, `MeshPhysicalMaterial`, procedural noise glow shaders, orbiting particle clusters, and smooth exponential damping (`THREE.MathUtils.damp`).
  - *Why*: Creates a captivating, tangible digital space that feels like a next-generation platform while adhering to the zero-external-asset policy (100% procedural textures).
  - *Alternatives Considered*: CSS-only 3D transforms were rejected due to lighting limitations and lack of realistic particle depth.
- **Decision 3: WebRTC Real Audio & Web Audio API Visualizer**
  - *Chosen Approach*: Peer connection signaling coordinated through Firestore room documents, combined with HTML5 `AudioContext` and `AnalyserNode` to drive real-time microphone level bars and avatar speaking halos.
  - *Why*: Eliminates mock call buttons and delivers functional voice rooms with true audio and responsive visual feedback.
  - *Alternatives Considered*: Third-party proprietary SDKs were avoided in favor of native standard browser WebRTC APIs.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                         DOOMCORD WEB CLIENT                            │
├──────────────┬───────────────────────────────┬─────────────────────────┤
│ Left Rail    │ Main Workspace                │ Contextual Panel        │
│ • Home / DMs │ • 3D Orbs Spatial Viewport    │ • Active Server Members │
│ • Server Nav │ • Chat Message Stream & Input │ • DM Recipient Details  │
│ • New Server │ • Friends Hub (Online/Pending)│ • Channel Pinned Items  │
│ • User Dock  │ • Global Search & Settings    │ • Voice Stage Grid      │
└──────┬───────┴───────────────┬───────────────┴─────────────┬───────────┘
       │                       │                             │
       ▼                       ▼                             ▼
┌──────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐
│   Auth Context   │  │ Reactive Store & UI │  │ WebRTC Audio Manager    │
│ (Firebase Auth)  │  │ (Firestore Synced)  │  │ (MediaStream & Analyser)│
└────────┬─────────┘  └──────────┬──────────┘  └─────────────┬───────────┘
         │                       │                           │
         ▼                       ▼                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       FIRESTORE CLOUD SERVICES                         │
│  /users/{uid}             /communities/{cid}/channels/{chid}/messages  │
│  /orbs/{orbId}            /direct_messages/{dmId}/messages             │
│  /friend_requests/{id}    /voice_rooms/{roomId}/signals                │
│  ABAC Security Rules Enforced: Zero-Trust, Validated Schemas, ABAC     │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Entities & Collections
1. `users`: Profile documents storing `displayName`, `username`, `photoURL`, `bio`, `statusMessage`, `presence` (`online` | `idle` | `dnd` | `invisible`), `accentColor`, `createdAt`.
2. `friends` & `friend_requests`: Bi-directional friendship records and pending requests with statuses (`pending`, `accepted`, `rejected`).
3. `direct_messages`: Conversations mapping `participants` array, `lastMessage`, `unreadCounts`, and subcollection `messages` (`senderId`, `content`, `attachments`, `reactions`, `readBy`, `createdAt`, `editedAt`).
4. `communities`: Server records with `name`, `iconUrl`, `description`, `ownerId`, `roles`, subcollections `channels` and `members`.
5. `orbs`: Floating realms with `name`, `category`, `description`, `icon`, `primaryColor`, `secondaryColor`, `visibility` (`public`, `friends`, `private`), `memberCount`, `activityScore`.
6. `voice_rooms`: Live WebRTC signaling documents tracking room members, mic state, and peer connection offer/answer exchange.

#### Interactive Component & State Mapping
- **Message Read Status**: When conversation `messages` are fetched or updated, a reactive hook checks if the active user is not in `readBy`. An atomic batch update appends the current user ID to `readBy`. The message component renders a single checkmark when sent, and a dual mint-colored checkmark with timestamp tooltip when read by the recipient.
- **3D Orbs Nexus**: A Three.js viewport renders procedural sphere meshes with orbiting particle rings. Clicking an Orb triggers camera glide, displays detailed realm stats, and allows instant joining or launching an Orb discussion thread.
- **Voice Channel Dock**: When joined, a bottom persistent audio bar reveals active mic/deafen toggles, output latency gauge, ping indicator, and disconnect button without blocking navigation across text channels.
- **Settings & Profile Customization**: Dedicated modal interface for live theme accents, presence selection, avatar upload, password changes, active session overview, and blocked user management.

---

### 5. Implementation Roadmap

1. **Step 1: Firebase Provisioning & Setup**: Trigger `show_aistudio_ui` for Firebase terms acceptance, verify with `GetFirebaseTos`, and provision with `ProvisionFirebase`.
2. **Step 2: Core Schemas, Rules & Error Handlers**: Write `firebase-blueprint.json`, draft and deploy hardened `firestore.rules`, and configure `handleFirestoreError`.
3. **Step 3: Design Tokens & Typography**: Configure Google Fonts (`Bricolage Grotesque` and `Figtree`) and OKLCH color system in `index.html` and Tailwind CSS.
4. **Step 4: Real-Time Chat & Read Receipts Engine**: Build direct messages and channel feeds with optimistic sending, editing, reactions, attachments, and read status indicators.
5. **Step 5: 3D Orbs Canvas & Interaction**: Implement procedural Three.js spatial view with custom shaders, orbital particle physics, and smooth interaction controls.
6. **Step 6: Voice Rooms & Audio Visualizers**: Implement real WebRTC audio capture, speaking detection halos, and the persistent voice dock.
7. **Step 7: Communities, Roles & Administration**: Community creation modal, role permissions matrix, invites, channel management, and member moderation.
8. **Step 8: Verification & Polish**: End-to-end testing across messaging, friends graph, Orbs navigation, audio rooms, and responsive mobile drawers.
