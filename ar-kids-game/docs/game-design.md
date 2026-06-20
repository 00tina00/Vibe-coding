# Game Design Document

## Target Audience

Children aged **3–6 years**. No reading skills required.

## Core Experience

A voice-guided treasure hunt where colorful 3D objects float over the live camera feed. The child sees a large icon at the top showing what to find, hears the name spoken aloud, and taps the matching floating object.

## Design Principles

1. **Always positive** — No lives, penalties, or game over
2. **Visual first** — Large icons, bright colors, high contrast
3. **Voice guided** — Every instruction is spoken
4. **Works everywhere** — Home, classroom, outdoors, moving car
5. **Simple interaction** — Single tap only

## Gameplay Loop

```text
Start → Camera opens → Objects spawn → Target shown + spoken
  → Child taps object
    → Correct: sparkle + success sound + +1 star + next target
    → Incorrect: gentle sound + encouragement + same target
  → Repeat forever
```

## Objects

| Object | Color | Recognition |
|--------|-------|-------------|
| Star | Gold | 5-point star shape |
| Sun | Orange | Circle with rays |
| Cloud | Light blue | Fluffy cloud blobs |
| Rainbow | Multi | Color arcs |
| Heart | Pink/red | Heart shape |
| Rocket | Purple | Rocket with fins |
| Teddy Bear | Brown | Round bear with ears |
| Butterfly | Purple | Wings spread |
| Dinosaur | Green | Body with tail and spikes |

All objects slowly rotate, float vertically, and emit a soft glow.

## Levels

| Level | Objects on screen | Advance after |
|-------|-------------------|---------------|
| 1 | 3 | 10 finds |
| 2 | 5 | 10 finds |
| 3 | 8 | 10 finds |

Level 3 is the maximum. After level 3, difficulty stays at 8 objects.

## Scoring

- Each correct find: **+1 star** (displayed as ⭐ count)
- Score persists to backend via API
- Milestone voice lines at 5, 10, 25 stars

## Audio Design

| Event | Sound Character |
|-------|----------------|
| Correct | Magical ascending chime + sparkle |
| Incorrect | Soft playful two-note bounce |
| Level up | Ascending fanfare |

All sounds generated with Tone.js (no external audio files).

## Voice Lines

Supported languages: English, French, Arabic, Persian.

Key phrases:

- "Find the [object]"
- "Great job!"
- "Now find the [object]"
- "Try again!"

## HUD Layout

```text
┌─────────────────────────────────┐
│           ⭐ 12                 │  ← Score
│                                 │
│         ┌─────────┐             │
│         │  TARGET │             │  ← Large icon
│         │   ICON  │             │
│         └─────────┘             │
│                                 │
│    [floating 3D objects]        │
│                                 │
└─────────────────────────────────┘
```

## Mobile Requirements

- Landscape orientation enforced
- Fullscreen camera + canvas
- Touch-only input
- Safe area insets respected
- Target: 60 FPS on mid-range phones

## 3D Assets

GLB files are expected at `frontend/public/models/`. The MVP includes procedural cartoon meshes as fallback when GLB files are not present. Replace with artist-created GLB assets for production.

## Parent Mode (Future)

Architecture supports optional text labels via HUD extension. Not enabled in MVP.
