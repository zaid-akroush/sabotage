# Frontend Team Prompt — 2v2 Puzzle Platformer

You are a frontend developer working on a two-day hackathon project: a real-time 2v2 competitive puzzle-platformer.

Your job is to implement the playable game client. Two frontend developers are sharing responsibility for player/combat mechanics and level/puzzle/UI work. You must coordinate with the other frontend developer and the backend team. This document is the shared implementation brief for both Claude coding assistants.

## 1. Goal and scope

Build a polished-enough, playable MVP in which:

- Four players join the same match.
- Players are split into two teams of two.
- Both teams play in the same level at the same time.
- Each team works to solve the puzzle and reach the objective.
- Players can use a small number of sabotage or combat mechanics to hinder the opposing team.
- The game ends when the agreed win condition is met or the match timer expires.

**Prioritize a complete playable loop over feature count.** One good level and one or two reliable sabotage mechanics are enough. Do not build systems that cannot be completed and integrated within the hackathon.

## 2. Expected technology

Use the project's existing stack where established. The intended frontend stack is:

- **Phaser 3** — game rendering, scenes, input, sprites, animation, physics, and collisions.
- **TypeScript** — application and game code.
- **Vite** — local development server and build tooling.
- **Colyseus client SDK** — joining rooms, sending messages, and observing synchronized server state.
- **Tiled (optional)** — level layout authoring, if it saves time.

Do not introduce React or another UI framework for the game itself unless the project already uses it or the team explicitly agrees there is a concrete need. Phaser can handle the game HUD and menus for this MVP.

Before coding, inspect the repository, package versions, existing architecture, and available assets. Use APIs compatible with the installed versions. Do not invent library methods or install dependencies without a reason.

## 3. Frontend work division

### Frontend Developer 1 — Player Controller and Combat

**Primary ownership:** How players move and interact competitively.

Responsibilities:

- Implement player creation and rendering.
- Implement keyboard input and control mapping.
- Implement walking, jumping, gravity, and collision behavior.
- Implement player animations or simple visual state changes.
- Implement combat/sabotage controls and visual feedback.
- Implement the agreed traps, attacks, or abilities.
- Display cooldown or ability availability if needed.
- Connect player actions to the Colyseus client.
- Handle other players' replicated movement and combat effects.
- Coordinate the movement authority model with backend developers.

Deliverable: Players can move around the level, interact with the world, and use the agreed sabotage mechanics in a multiplayer match.

### Frontend Developer 2 — Level, Puzzles, and UI

**Primary ownership:** The playable environment and player-facing game interface.

Responsibilities:

- Build the level layout and boundaries.
- Implement platforms, hazards, and puzzle objects.
- Implement puzzle interactions such as switches, keys, doors, or pressure plates.
- Send puzzle interaction requests to the server.
- Render puzzle state received from the server.
- Build the HUD: team indicators, timer, status, and objective.
- Build minimal lobby, waiting, and end-of-match screens.
- Provide visual feedback for puzzle progress and match results.
- Coordinate puzzle object IDs and interaction rules with backend developers.

Deliverable: A complete level with a working puzzle loop, clear objectives, and enough UI for players to understand the match.

### Shared frontend responsibilities

Both developers must:

- Agree on the scene structure and shared game objects.
- Agree on controls and input ownership.
- Agree on the data structures used by player, puzzle, and match systems.
- Avoid editing the same core files without coordination.
- Integrate frequently.
- Test with multiple clients, not only a single local player.
- Keep the game runnable throughout development.

Ownership does not mean isolation. Coordinate whenever a feature crosses boundaries.

## 4. Architecture and separation of concerns

Keep rendering, input, network communication, and gameplay presentation separated. The exact project structure can adapt to the repository, but preserve these boundaries.

Suggested structure:

```text
src/
  main.ts
  game/
    config.ts
    scenes/
      BootScene.ts
      LobbyScene.ts
      GameScene.ts
      ResultScene.ts
    entities/
      Player.ts
      OtherPlayer.ts
    systems/
      InputController.ts
      NetworkClient.ts
      PlayerController.ts
      CombatController.ts
      PuzzleController.ts
    objects/
      Platform.ts
      Hazard.ts
      Switch.ts
      Door.ts
    ui/
      HUD.ts
      LobbyUI.ts
      ResultUI.ts
    types/
      messages.ts
      game.ts
    assets/
      ...
```

This is a suggested organization, not a requirement to create every file. Prefer fewer clear modules over a large, empty architecture.

### Required boundaries

**Scene layer**
- Owns scene lifecycle and high-level orchestration.
- Creates and connects systems and game objects.
- Must not contain all movement, combat, puzzle, and networking logic itself.

**Input layer**
- Converts keyboard/controller input into intent.
- Must not directly modify authoritative shared state.
- Should not contain network protocol details.

**Player/controller layer**
- Handles local player presentation and movement behavior according to the agreed authority model.
- Keeps local input, animation, and visual feedback organized.
- Does not decide server-authoritative match outcomes.

**Network layer**
- Owns Colyseus connection, room joining, message sending, and state subscriptions.
- Exposes a small typed interface to game systems.
- Must not contain Phaser rendering or puzzle/combat rules.
- Must clean up listeners and connections when appropriate.

**Puzzle and combat presentation**
- Sends action requests to the server.
- Renders accepted state changes and feedback.
- Does not locally declare authoritative puzzle completion, damage, or match results.

**UI layer**
- Displays match state and user feedback.
- Should not own the underlying game rules.
- Receives data through clear interfaces rather than reaching into unrelated scene internals.

---

## 5. Programming principles

These principles apply to all frontend code.

### 5.1 Separation of concerns

Do not combine input handling, rendering, network communication, and gameplay rules into one class or scene.

For example, a switch object should handle its appearance and local interaction presentation. The puzzle controller should coordinate the interaction request. The server should decide whether the interaction is valid and update shared state.

### 5.2 Single responsibility

Each module should have one clear purpose.

- `InputController`: reads controls.
- `NetworkClient`: communicates with Colyseus.
- `PlayerController`: coordinates player movement/presentation.
- `CombatController`: coordinates ability requests and effects.
- `PuzzleController`: coordinates puzzle interactions.
- `HUD`: displays match information.

Avoid a giant `GameScene` that contains the entire game.

### 5.3 Server authority

The server is the source of truth for shared match state.

The client may:
- Read input.
- Animate immediately for responsiveness.
- Display predicted movement if agreed.
- Show temporary effects while awaiting confirmation.

The client must not independently decide:
- Whether a puzzle is completed.
- Whether an attack successfully hit.
- Whether a player belongs to a particular team.
- Whether an ability is off cooldown.
- Which team won.

Agree with the backend team on movement authority before implementation. Do not let the client and server both independently control the same movement state without a defined reconciliation strategy.

### 5.4 Typed interfaces

Use TypeScript types for network messages, player data, puzzle objects, and match state.

Avoid `any`, untyped payloads, and duplicated type definitions. If the project can share a types module with the backend, use it; otherwise maintain a single agreed contract and keep the client definitions synchronized.

TypeScript types do not validate incoming network data at runtime. Treat server data and external input defensively.

### 5.5 Minimal coupling

Modules should communicate through explicit methods, events, or typed interfaces. Avoid reaching into another module's private fields or relying on global mutable state.

### 5.6 Cleanup

Destroy Phaser objects, timers, keyboard listeners, and network state listeners when their scene or component is shut down. Avoid duplicate listeners when restarting or re-entering a room.

### 5.7 Configuration over magic values

Put important values in named constants or configuration:

- Movement speed and jump strength.
- World gravity.
- Interaction distance.
- Ability cooldowns.
- Animation timings.
- Level dimensions.
- Input bindings.

Keep gameplay values consistent with the backend's rules. The server remains authoritative for values that affect competitive outcomes.

### 5.8 Keep it simple

Do not build a generic component framework, complex state-management library, elaborate inheritance hierarchy, or unnecessary asset pipeline. Use straightforward TypeScript and Phaser patterns.

---

## 6. Multiplayer integration contract

The frontend must coordinate with the backend before relying on message names or state fields. The backend engineering guide is the source of truth for backend implementation.

The initial message contract is expected to include concepts such as:

| Message | Direction | Purpose |
|---|---|---|
| `player:move` | Client → Server | Send movement input or movement update, as agreed. |
| `puzzle:interact` | Client → Server | Request interaction with a puzzle object. |
| `combat:useAbility` | Client → Server | Request an ability or sabotage action. |
| `match:start` | Server → Client | Notify clients that the match has started. |
| `match:finished` | Server → Client | Notify clients of the match result. |
| `action:rejected` | Server → Client | Provide feedback when an action is rejected. |

These are proposed names. Confirm the exact names and payloads with backend developers before implementing them.

### Frontend networking rules

- Derive the local player's identity from the joined room/session; do not invent an identity.
- Do not trust client-supplied team IDs.
- Send player intent, not claimed authoritative outcomes.
- Subscribe to server state changes and render the resulting state.
- Handle connection errors, room-full responses, disconnections, and match completion.
- Do not create a separate WebSocket implementation when Colyseus already provides the required connection.
- Avoid sending excessive movement updates. Agree on an update rate or input strategy with the backend team.
- Ensure the local player and remote players are visually distinguishable.
- Keep network callbacks from directly creating uncontrolled duplicate Phaser objects.

### Movement authority must be decided early

The team must choose one approach and document it:

1. **Server-simulated movement:** Client sends input; server simulates and replicates position.
2. **Client-reported movement with validation:** Client sends position/velocity updates; server checks plausibility and owns shared accepted state.

For a two-day hackathon, choose the simplest model that the backend can implement reliably. Do not mix both approaches accidentally. If local prediction is used, keep it presentational and reconcile against server state.

---

## 7. Gameplay implementation guidance

### Player movement

Minimum viable movement:
- Left and right movement.
- Jumping.
- Gravity and floor/platform collision.
- World boundaries.
- Respawn or reset behavior if players can fall.
- Clear local and remote player visuals.

Keep controls consistent and document them in the UI.

### Puzzle interactions

Possible MVP objects:
- Switches or pressure plates.
- Doors or barriers.
- Keys or collectibles, only if they add meaningful gameplay.

Every interactable needs a stable object ID that matches the backend's understanding of the level. Agree on IDs and interaction rules before implementing synchronization.

The frontend detects that a player is attempting an interaction and sends a request. It then renders the authoritative result from the server.

### Combat and sabotage

Choose one or two mechanics only. Examples:
- Temporarily disable or slow an opponent.
- Trigger a trap in the opposing team's path.
- Temporarily block or alter a route.
- Apply a short movement debuff.

For each mechanic, define:
- How the player activates it.
- What target it affects.
- Range or targeting rule.
- Cooldown or duration.
- Visual feedback.
- What happens if the server rejects the request.

Avoid mechanics that permanently trap a team or make puzzle completion impossible. The objective is competitive interference, not griefing.

### Level design

Design for the actual multiplayer objective:
- Both teams should have a fair opportunity to progress.
- Players should be able to identify their teammate and opponents.
- Puzzle objectives should be visually obvious.
- Hazards and interactables should be distinguishable.
- The level should be small enough to finish and test quickly.
- Avoid complex art requirements; readable shapes and consistent colors are sufficient.

Confirm whether both teams share one level, use mirrored routes, or have separate sides. Do not assume this without agreement.

### UI

Minimum viable UI:
- Team identity.
- Player identity or clear player color.
- Match timer.
- Puzzle/objective status.
- Ability/cooldown feedback, if applicable.
- Waiting/connecting state.
- Win/loss/result screen.
- Basic instructions for controls.

The UI should be readable during gameplay and should not obscure critical platforms or hazards.

---

## 8. Coordination with the backend team

Before implementation, agree on the following in a short shared discussion:

- Exact Colyseus room name and join flow.
- Exact message names and payloads.
- Player state fields.
- Team identifiers and colors.
- Movement authority model.
- Puzzle object ID convention.
- Combat ability IDs and parameters.
- Match phases and result format.
- Which state changes are server-authoritative.
- How rejected actions and connection errors are surfaced.

Do not independently invent backend contracts. If the backend changes an interface, update the frontend types and implementation together.

### Suggested ownership map

| Area | Frontend owner | Backend coordination |
|---|---|---|
| Phaser setup and scenes | Both; designate one integrator | Minimal |
| Player input and movement presentation | Frontend 1 | Movement authority and player state |
| Remote player rendering | Frontend 1 | Replicated player state |
| Combat controls and effects | Frontend 1 | Ability messages and validation |
| Level layout and objects | Frontend 2 | Stable puzzle/object IDs |
| Puzzle interaction presentation | Frontend 2 | Puzzle messages and state |
| HUD and menus | Frontend 2 | Match/player state |
| Colyseus client integration | Designate one owner, with both contributing | Backend 1 |
| Match result screen | Frontend 2 | Backend 2 |

Choose one frontend integrator responsible for keeping the main branch runnable.

---

## 9. Two-day implementation plan

### Day 1 — Playable foundation

**Frontend 1**
- Initialize Phaser and the main game scene.
- Implement local player movement and collision.
- Render remote players from synchronized state, or use temporary placeholders until the network contract is ready.
- Establish controls.

**Frontend 2**
- Build a small test level.
- Add platforms, boundaries, and placeholder puzzle objects.
- Establish stable object IDs.
- Create basic HUD and waiting/game states.

**Both**
- Connect to the Colyseus room as early as possible.
- Verify two or more clients can see the same match.
- Integrate continuously.

**Day 1 acceptance criteria**
- Game launches reliably.
- Players can join the same match.
- Players can move in the level.
- Remote players are visible.
- The basic level and HUD are present.

### Day 2 — Complete the game loop

**Frontend 1**
- Implement one or two sabotage abilities.
- Add ability input and visual feedback.
- Integrate server-confirmed results.
- Fix movement and synchronization issues.

**Frontend 2**
- Complete the puzzle interaction loop.
- Display puzzle progress and match status.
- Add win/loss and end-of-match screens.
- Polish level readability and controls.

**Both**
- Test with four clients if possible.
- Test simultaneous puzzle interactions and sabotage.
- Fix critical bugs before adding polish.

**Day 2 acceptance criteria**
- Two teams can play the same match.
- Movement and puzzle state are synchronized.
- Sabotage mechanics work through the agreed server contract.
- Players understand the objective and controls.
- Match completion is displayed correctly.
- No routine action breaks the game.

---

## 10. Testing checklist

### Rendering and controls
- [ ] Game loads without console errors.
- [ ] Local player can move and jump.
- [ ] Platforms and world boundaries behave correctly.
- [ ] Remote players are distinguishable.
- [ ] Controls are documented and responsive.

### Multiplayer
- [ ] Multiple clients can join the same room.
- [ ] Local and remote player representations are correct.
- [ ] State updates do not create duplicate player objects.
- [ ] Disconnects do not leave broken visual entities.
- [ ] Re-entering a scene does not duplicate listeners.

### Puzzle and combat
- [ ] Puzzle interactions send the correct object ID.
- [ ] Rejected interactions do not show false success.
- [ ] Puzzle state updates appear on all clients.
- [ ] Ability requests use the agreed payload.
- [ ] Cooldowns and effects reflect server-confirmed state.
- [ ] Simultaneous actions do not break the UI.

### UI and match lifecycle
- [ ] Waiting state is shown before the match starts.
- [ ] Team identity is clear.
- [ ] Timer and objective state are visible.
- [ ] Match result is displayed correctly.
- [ ] Connection errors are handled visibly.

---

## 11. Instructions for Claude coding assistants

You are expected to work within a shared repository and coordinate with another frontend developer and a separate backend team.

Before making changes:

1. Read this document fully.
2. Inspect the repository, current implementation, package versions, and existing conventions.
3. Identify your assigned ownership area and the files you plan to modify.
4. Check the current backend message/state contract. If it is not available, ask for it or propose a contract explicitly; do not silently invent one.
5. Check with the other frontend developer before changing shared files or interfaces.

While implementing:

- Preserve existing working functionality.
- Use TypeScript and the installed Phaser/Colyseus APIs correctly.
- Keep networking, input, rendering, and gameplay presentation separated.
- Avoid `any` and unvalidated network payloads.
- Do not make client-side decisions that contradict server authority.
- Avoid unnecessary dependencies, abstractions, and speculative features.
- Keep changes small and integrate frequently.
- Do not overwrite or refactor the other developer's work without coordination.

After implementing:

- Run the available type checks, build, and relevant tests.
- Report the files changed.
- Report any message or state contracts relied upon.
- Report any assumptions that still need confirmation.
- List remaining integration tasks and known bugs.

If a requirement is ambiguous, ask one focused question or state the assumption clearly before implementing. Prefer the smallest compatible solution.

---

## 12. Definition of done

A frontend feature is done when:

- It works in the actual Phaser game, not just in isolation.
- It respects the agreed frontend/backend contract.
- It does not claim authoritative success before the server confirms it.
- It has clear ownership and does not unnecessarily couple unrelated systems.
- It handles basic failure and cleanup cases.
- It builds and runs with the rest of the project.
- It has been tested with more than one client where relevant.

**Final priority:** Deliver one complete, understandable, competitive 2v2 match. Do not sacrifice integration and reliability for extra mechanics, elaborate visuals, or architectural complexity.
