# Backend Engineering Guide — 2v2 Puzzle Platformer

## 1. Purpose

This document is the shared backend engineering contract for both backend developers and their Claude coding assistants.

The goal is to build a working multiplayer backend for a 2v2 puzzle-platformer within a two-day hackathon. Both developers must follow the same architecture, interfaces, naming conventions, and ownership boundaries.

**Backend stack:** TypeScript + Node.js + Colyseus.

**Core principle:** Keep the backend authoritative over shared match state, while keeping networking, game rules, and state representation cleanly separated.

Do not over-engineer. Prefer the smallest reliable implementation that supports the agreed MVP.

---

## 2. Backend responsibilities

The backend owns:

- Colyseus room creation and lifecycle.
- Player connections, disconnections, and reconnections where feasible.
- Player identity and team assignment.
- Authoritative shared match state.
- Synchronization of player state between clients.
- Validation and processing of gameplay actions.
- Puzzle state synchronization.
- Combat and sabotage event validation.
- Match timer, win conditions, and match termination.
- Basic protection against invalid or impossible client actions.

The frontend owns:

- Rendering and animation.
- Keyboard/controller input collection.
- Local visual effects and presentation.
- Level visuals and layout.
- Client-side prediction or interpolation, if implemented.
- UI presentation.

The frontend may predict or display an action, but the backend decides whether a shared gameplay action is valid and whether it changes authoritative game state.

---

## 3. Division of backend work

### Backend Developer 1 — Colyseus and Networking

**Primary ownership:** Room lifecycle and client-server communication.

Responsibilities:

- Set up the Colyseus server and project structure.
- Implement the game room.
- Handle player joining and leaving.
- Assign players to teams (two players per team).
- Maintain player connection status.
- Define and register incoming client messages.
- Broadcast or synchronize state through Colyseus.
- Handle room capacity and match start conditions.
- Coordinate the message contract with the game-logic developer.

Deliverables:

- A client can connect to a room.
- Up to four players can join.
- Players receive stable IDs and team assignments.
- Players can send movement and gameplay messages.
- Connected clients receive synchronized state.
- Room lifecycle works for a complete match.

### Backend Developer 2 — Game State and Rules

**Primary ownership:** Authoritative gameplay rules and match progression.

Responsibilities:

- Define the match state and player state models.
- Implement match phases: waiting, playing, finished.
- Validate player actions.
- Process puzzle interactions.
- Process combat and sabotage actions.
- Maintain the match timer.
- Evaluate team completion and win conditions.
- Handle player elimination or incapacitation if part of the agreed design.
- Expose clear functions that the room/networking layer can call.

Deliverables:

- A deterministic, testable game-state model.
- Validated puzzle interactions.
- Validated combat/sabotage events.
- Match timer and win-condition logic.
- A clear interface for the room to invoke game rules.

### Shared ownership

Both developers must agree on:

- State schema.
- Message names and payloads.
- Team and player identifiers.
- Match lifecycle.
- Error handling.
- Integration tests.

Neither developer should independently invent or change shared interfaces.

---

## 4. Required architecture and separation of concerns

Keep the code divided into distinct layers. The exact folder layout can be adapted to the existing project, but the boundaries must remain.

```text
src/
  rooms/
    GameRoom.ts              # Colyseus room, lifecycle, message routing
  state/
    GameState.ts              # Colyseus-synchronized state schema
    PlayerState.ts            # Synchronized player fields
  game/
    MatchManager.ts           # Match phases, timer, win conditions
    PlayerManager.ts          # Player registration and team assignment
    PuzzleManager.ts          # Puzzle interaction rules and state
    CombatManager.ts          # Combat/sabotage validation and effects
  messages/
    messageTypes.ts           # Message names and payload types
    validators.ts             # Input validation
  shared/
    constants.ts              # Shared limits and configuration
    types.ts                  # Common domain types
  tests/
    ...                       # Unit and integration tests
```

### Layer responsibilities

**Room / networking layer**

- Knows about Colyseus clients, rooms, and messages.
- Receives messages and validates their basic shape.
- Delegates gameplay decisions to game services.
- Updates synchronized state using the agreed state model.
- Does not contain puzzle rules, combat calculations, or win-condition logic.

**Game-logic layer**

- Contains gameplay rules and decisions.
- Should be testable without a connected client or running Colyseus room.
- Receives plain data and returns explicit results.
- Should not import or depend on Colyseus classes.
- Must not send network messages directly.

**State layer**

- Defines the data that clients need to observe.
- Contains state, not gameplay decision-making.
- Avoid putting complex algorithms or game rules inside schema classes.
- Only expose fields that clients need.

**Validation layer**

- Checks message shape, types, ranges, and required fields.
- Checks gameplay constraints in coordination with game logic.
- Never trusts client-provided team IDs, scores, puzzle completion, damage, or match outcomes.

---

## 5. Programming principles

These principles are mandatory unless both developers explicitly agree on an exception.

### 5.1 Single responsibility

Each class and module should have one clear reason to change.

Examples:

- `GameRoom` handles room lifecycle and message routing.
- `CombatManager` handles combat rules.
- `PuzzleManager` handles puzzle rules.
- `MatchManager` handles match progression.

Do not create a giant room class containing the entire game.

### 5.2 Separation of concerns

Networking, state representation, validation, and gameplay rules must remain separate.

A message handler should receive a request, validate it, delegate it, and apply the result. It should not implement the entire gameplay feature inline.

### 5.3 Single source of truth

The server is authoritative for shared match state.

Clients may send **intent** (for example, “move right”, “activate switch”, or “use ability”). They must not dictate the result (for example, “I am now at x=500”, “the door is open”, or “the other player has taken 30 damage”).

For movement, agree with the frontend on the authority model immediately. If the client sends positions, the server must validate plausible movement and reject impossible values. If the server simulates movement, it must own the relevant movement rules. Do not accidentally mix both models.

### 5.4 Explicit interfaces

Use TypeScript types for all message payloads, service inputs, and service outputs.

Avoid `any`. Avoid untyped message payloads. Prefer discriminated unions for messages and explicit result types for actions.

### 5.5 Dependency direction

High-level game rules should not depend on networking infrastructure.

For example:

- `CombatManager` must not import `GameRoom`.
- `PuzzleManager` must not access a Colyseus client.
- `GameRoom` may call `CombatManager` and `PuzzleManager`.

### 5.6 Keep functions small and predictable

A function should perform one coherent operation. Prefer explicit inputs and outputs over hidden side effects.

Avoid deeply nested conditionals, duplicated rule checks, and functions that modify unrelated parts of the game state.

### 5.7 Configuration over magic values

Put shared limits and tunable values in named constants or configuration.

Examples:

- Maximum players per room: 4.
- Players per team: 2.
- Ability cooldowns.
- Match duration.
- Damage values.
- Interaction distances.

Do not scatter unexplained numeric literals throughout the code.

### 5.8 Fail safely

Invalid messages must not crash the room or corrupt state.

Reject invalid actions with a clear error response or ignore them safely. Log useful development errors without dumping excessive data.

### 5.9 Avoid premature abstraction

This is a two-day hackathon. Do not build a generic game framework, plugin system, event bus, elaborate inheritance hierarchy, or unnecessary database layer.

Use straightforward modules and direct function calls. Abstract only when it removes real duplication or clarifies an existing boundary.

---

## 6. Client-server message contract

Agree on message names and payloads before implementation. These are suggested starting points; finalize them with the frontend team.

| Message | Direction | Purpose |
|---|---|---|
| `player:move` | Client → Server | Send movement input or validated movement update, depending on the agreed movement model. |
| `puzzle:interact` | Client → Server | Request interaction with a puzzle object. |
| `combat:useAbility` | Client → Server | Request use of a combat/sabotage ability. |
| `match:start` | Server → Client | Notify clients that the match has started. |
| `match:finished` | Server → Client | Notify clients of the result. |
| `action:rejected` | Server → Client | Explain why a requested action was rejected. |

### Message contract rules

- Use consistent namespaced message names.
- Define payload types centrally.
- Validate every client payload at runtime; TypeScript types alone do not validate network data.
- Derive the sender's player identity from the connected Colyseus client.
- Never accept a client-supplied identity as proof of who sent the message.
- Never trust client-supplied team IDs or authoritative outcomes.
- Keep payloads small and purposeful.
- Document any message change and update both backend developers and frontend developers.

### Suggested payload shapes

```ts
type MoveInput = {
  horizontal: -1 | 0 | 1;
  jump: boolean;
};

type PuzzleInteractRequest = {
  objectId: string;
  interaction: "activate" | "deactivate";
};

type UseAbilityRequest = {
  abilityId: string;
  targetPlayerId?: string;
  targetObjectId?: string;
};
```

These are examples, not permission to implement incompatible movement or combat models. Confirm the actual contract with the frontend team.

---

## 7. Shared state model

Keep the synchronized state minimal and explicit. A possible starting point:

```ts
type TeamId = "red" | "blue";

type MatchPhase = "waiting" | "playing" | "finished";

type PlayerData = {
  playerId: string;
  teamId: TeamId;
  connected: boolean;
  // Add position/health fields according to the agreed authority model.
};

type MatchData = {
  phase: MatchPhase;
  remainingTime: number;
  winner: TeamId | null;
};
```

If using Colyseus `Schema` classes, implement the synchronized representation using the appropriate Colyseus schema types and decorators for the installed version.

Do not assume ordinary TypeScript interfaces are automatically synchronized by Colyseus.

Keep internal server-only data separate from client-visible synchronized state. For example, internal cooldown timestamps or anti-abuse metadata do not necessarily need to be replicated.

---

## 8. Authoritative action flow

Every gameplay action should follow a predictable path:

1. Client sends an action request.
2. Room identifies the sender from the connection.
3. Payload is validated.
4. Game logic checks whether the action is legal in the current match state.
5. Game logic returns an explicit success/failure result and any state changes.
6. Room applies the accepted changes to synchronized state.
7. Colyseus propagates the updated state to clients.

Example conceptual flow:

```ts
room.onMessage("puzzle:interact", (client, payload) => {
  const validation = validatePuzzleRequest(payload);

  if (!validation.ok) {
    return rejectAction(client, validation.reason);
  }

  const player = findPlayerForClient(client);

  if (!player) {
    return rejectAction(client, "Player not found");
  }

  const result = puzzleManager.interact({
    player,
    request: validation.value,
    match: currentMatch,
  });

  if (!result.ok) {
    return rejectAction(client, result.reason);
  }

  applyPuzzleChanges(result.changes);
});
```

Adapt this to the actual types and Colyseus API version. Do not copy the pseudocode blindly.

---

## 9. Integration rules

Both backend developers must work against the same shared interfaces.

- Agree on file ownership before editing.
- Do not independently modify the same core files without coordination.
- Put shared types in a common module.
- Commit small, working changes frequently.
- Pull and integrate regularly rather than waiting until the end.
- Do not rename message events or state fields without notifying the other developer and frontend team.
- Keep the server runnable after each integration.
- If an interface must change, update its definition first, communicate the change, then update implementations.

### Suggested ownership boundaries

| Area | Primary owner | Collaborator |
|---|---|---|
| Colyseus server and room lifecycle | Backend 1 | Backend 2 |
| Message registration/routing | Backend 1 | Backend 2 |
| Player/team registration | Backend 1 | Backend 2 |
| Synchronized state schema | Backend 2 | Backend 1 |
| Puzzle rules | Backend 2 | Frontend 2 |
| Combat rules | Backend 2 | Frontend 1 |
| Match timer and win conditions | Backend 2 | Backend 1 |
| Shared message/type contracts | Both | Frontend representatives |

This is an ownership map, not a wall. Coordinate whenever a feature crosses boundaries.

---

## 10. Two-day implementation plan

### Day 1 — Get multiplayer working

**Backend 1**
- Initialize Colyseus server.
- Create room and connection lifecycle.
- Support four players.
- Assign teams.
- Register basic messages.

**Backend 2**
- Define player and match state.
- Implement match phases.
- Implement basic authoritative state updates.
- Implement win-condition skeleton.

**End-of-day acceptance criteria**
- Four clients can join the same room.
- Each client has a stable player identity.
- Teams are assigned correctly.
- Basic player state is synchronized.
- Match can transition from waiting to playing.

### Day 2 — Complete the gameplay loop

**Backend 1**
- Finish disconnect handling.
- Harden message routing and validation.
- Test multiple clients and room lifecycle.
- Assist with integration bugs.

**Backend 2**
- Implement puzzle interaction rules.
- Implement agreed combat/sabotage rules.
- Implement timer and match completion.
- Test invalid actions and edge cases.

**End-of-day acceptance criteria**
- Both teams can play the same match.
- Puzzle interactions synchronize correctly.
- Sabotage actions are validated by the server.
- Match ends with a consistent result.
- No routine player action crashes or corrupts the room.

---

## 11. Testing checklist

### Connection and rooms
- [ ] A player can join a room.
- [ ] A fifth player cannot join a four-player room.
- [ ] Players receive unique IDs.
- [ ] Teams contain no more than two players.
- [ ] Disconnecting a player does not crash the room.
- [ ] Match start conditions work.

### State and synchronization
- [ ] All clients observe the same match phase.
- [ ] Player state updates reach the other clients.
- [ ] Puzzle state is consistent across clients.
- [ ] Combat effects are consistent across clients.
- [ ] Match result is identical for all clients.

### Validation and game rules
- [ ] Unknown message types are handled safely.
- [ ] Malformed payloads are rejected.
- [ ] Clients cannot impersonate other players.
- [ ] Clients cannot choose their own team.
- [ ] Clients cannot directly declare puzzle completion.
- [ ] Clients cannot directly declare a winner.
- [ ] Invalid targets and interactions are rejected.
- [ ] Abilities respect cooldowns and match phase.
- [ ] Repeated messages do not cause unintended duplicate effects.

---

## 12. Instructions for Claude coding assistants

Every Claude instance working on the backend must:

1. Read this document before changing backend code.
2. Inspect the existing repository and follow its established conventions where they do not conflict with this document.
3. Confirm the files and interfaces it intends to change.
4. Respect the assigned ownership boundaries.
5. Avoid changing shared contracts without explicit coordination.
6. Use the installed Colyseus version's actual API; do not invent methods or rely on outdated examples.
7. Use TypeScript types and runtime validation for network input.
8. Keep game rules independent of Colyseus infrastructure.
9. Avoid unnecessary dependencies and abstractions.
10. Run relevant tests and type checks after changes.
11. Report files changed, interfaces affected, commands run, and any outstanding integration requirements.
12. If requirements are ambiguous, identify the ambiguity and propose the smallest compatible solution instead of silently inventing a new design.

**Do not rewrite working code simply to impose a preferred architecture.** Improve the existing implementation incrementally, especially under hackathon time constraints.

---

## 13. Definition of done

A backend feature is complete only when:

- Its responsibility is clear and does not violate separation of concerns.
- Its inputs and outputs are typed.
- Client-controlled data is validated.
- It updates authoritative state correctly.
- It does not break the other developer's interfaces.
- It has been tested at least at the relevant unit or integration level.
- The server still starts and runs.

**Final engineering rule:** Build the smallest backend that can reliably support the complete 2v2 gameplay loop. A working, integrated game is the objective—not architectural perfection.
