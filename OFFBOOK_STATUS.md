# OffBook — Project Status
*Last updated: April 11, 2026*

---

## What's Built

OffBook is a mobile-first web app for actors to rehearse lines. Users paste a script, pick their character and scene, then practice with speech or text input across 5 difficulty modes. No backend — runs entirely in the browser.

**Live URL:** https://offbook-app.netlify.app  
**GitHub:** https://github.com/historytheater123/offbook  
**Netlify Dashboard:** https://app.netlify.com/projects/offbook-app  
**Local:** `/Users/jaredmoore/offbook`

---

## Accounts & Access

| Service | Account |
|---------|---------|
| GitHub | historytheater123 (comedytourguide@gmail.com) |
| Netlify | D Redman (comedytourguide@gmail.com) |

**Auto-deploy is live** — every push to `main` triggers a Netlify rebuild automatically.

To deploy changes:
```bash
cd /Users/jaredmoore/offbook
git add -A && git commit -m "your message"
GH_TOKEN=$(gh auth token) git -c credential.helper='!f() { echo username=token; echo password=$GH_TOKEN; }; f' push origin main
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| State | React Context (no router, state machine) |
| Persistence | localStorage (`offbook_data` key) |
| Speech input | Web Speech API (SpeechRecognition) |
| TTS | Web Speech API (SpeechSynthesis) |
| Sharing | LZ-string compressed URL hash |
| Hosting | Netlify (static) |

---

## Screens Built

| # | Screen | File | Status |
|---|--------|------|--------|
| 1 | Splash | `src/screens/Splash.tsx` | ✅ Done |
| 2 | Script Upload | `src/screens/ScriptUpload.tsx` | ✅ Done |
| 3 | Character Select | `src/screens/CharacterSelect.tsx` | ✅ Done |
| 4 | Scene Select | `src/screens/SceneSelect.tsx` | ✅ Done |
| 5 | Rehearsal | `src/screens/Rehearsal.tsx` | ✅ Done |
| 6 | Modes & Settings | `src/screens/ModesSettings.tsx` | ✅ Done |
| 7 | Run-Through Stats | `src/screens/RunStats.tsx` | ✅ Done |

---

## Features Implemented

### Core
- [x] Script parser — `CHARACTER: dialogue` format
- [x] Strips `[stage directions]` and `(parentheticals)`
- [x] Scene break detection — `ACT`, `SCENE`, `---` separators
- [x] 500-line limit with error message
- [x] Real-time validation with character/line count tags
- [x] 4 pre-loaded sample scripts (comedy/improv style)

### Rehearsal Modes (5)
- [x] **Prompter** (Easy) — full script with ±2 line context
- [x] **Highlight** (Medium) — only cue words shown for player lines
- [x] **Hidden Lines** (Hard) — player lines blurred
- [x] **Cue Only** (Hard) — only previous line visible
- [x] **Full Blackout** (Expert) — no script at all

### Input & Feedback
- [x] Text input with Enter-to-submit
- [x] Mic button (Web Speech API) with recording animation
- [x] Word-by-word accuracy scoring with Levenshtein fuzzy match
- [x] Feedback: percentage, "Expected" card, "You said" card, Correct/Missed/Extra stats
- [x] Retry line / Next line buttons
- [x] Auto-advance on 80%+ accuracy (toggleable)
- [x] Loop trouble lines — repeats lines under 70% up to 3x (toggleable)

### Speech
- [x] Speech recognition (Chrome Android + Safari iOS)
- [x] Real-time interim transcription displayed in input field
- [x] Text-to-speech for other characters' lines (toggleable)
- [x] Graceful fallback if browser doesn't support speech

### Persistence & Sharing
- [x] Progress saved to localStorage after each line and run-through
- [x] Best accuracy + run count shown on scene select cards
- [x] Settings persist across sessions
- [x] Share script — LZ-string compressed URL, copies to clipboard
- [x] Opening share URL auto-loads the script

### Design
- [x] Notion-inspired aesthetic — clean white cards, 1px borders, warm off-white bg
- [x] Source Serif 4 (headings) + DM Sans (body)
- [x] Rotated "O" logo mark
- [x] App icon (black rounded square with script SVG)
- [x] Mobile-first layout, 390px max-width centered
- [x] Difficulty color tags (green/amber/coral/red)
- [x] Dot-style tab bar in Rehearsal
- [x] CSS arrow back buttons throughout
- [x] SVG circle checkmarks on character select

---

## Project Structure

```
offbook/
├── src/
│   ├── App.tsx                    # State machine + 390px wrapper
│   ├── main.tsx
│   ├── index.css                  # Tailwind + design tokens (CSS vars)
│   ├── contexts/
│   │   └── ScriptContext.tsx      # All global state + localStorage
│   ├── screens/
│   │   ├── Splash.tsx
│   │   ├── ScriptUpload.tsx
│   │   ├── CharacterSelect.tsx
│   │   ├── SceneSelect.tsx
│   │   ├── Rehearsal.tsx
│   │   ├── ModesSettings.tsx      # Modes + Settings combined
│   │   └── RunStats.tsx
│   ├── components/
│   │   ├── MicButton.tsx          # 52px black circle, pulse animation
│   │   └── ProgressBar.tsx
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts
│   │   ├── useTextToSpeech.ts
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── scriptParser.ts        # Parser + validator + hashScript
│   │   ├── lineCompare.ts         # Levenshtein fuzzy word diff
│   │   ├── shareUrl.ts            # LZ-string encode/decode
│   │   └── scriptLibrary.ts      # 4 built-in comedy scripts
│   └── types/
│       └── index.ts
├── netlify.toml                   # build: npm run build, publish: dist
└── .claude/launch.json            # Dev server config for Claude preview
```

---

## Known Limitations / V2 Backlog

- Character names from library scripts render ALL CAPS (e.g., BARISTA, CUSTOMER) — this is correct per the script format but could be title-cased for display
- Script title detection pulls the first non-dialogue line verbatim (e.g., "THE WRONG ORDER") — could be title-cased
- Speech recognition requires HTTPS (works on Netlify, not on `http://localhost`)
- iOS Safari has limited SpeechRecognition support — text input fallback always available
- No user accounts — progress is device-local only
- 500-line limit for v1

### V2 Ideas (from original scope)
- User accounts + cross-device sync
- File upload (.txt, .pdf)
- Native iOS/Android app
- Director mode (assign scripts, track cast)
- Push notifications for practice reminders
- PDF import with OCR
- Recording playback
