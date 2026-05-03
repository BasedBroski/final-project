# Soyjak Arcade

> A three-mode browser arcade with score systems, account login, profile editing, and AI-driven dialogue gameplay.

## Author
- BasedBroski
- GitHub: https://github.com/BasedBroski

## User Story
- As a player,
- I want multiple mini-games with persistent identity and profile data,
- So that I can play, track progress, and personalize my experience in one app.

## Narrative
Soyjak Arcade started as a single drag game and was expanded into a multi-mode front-end application with authentication, profile management, music controls, and three playable experiences: drag, chase, and dating sim.

I chose this project to demonstrate practical semester outcomes in one cohesive codebase: reusable UI patterns, modular JavaScript, local/session storage, form handling, dynamic DOM updates, and fetch-based JSON communication.

This final version improves the original project by:
- adding login/signup/logout and protected routes,
- adding profile creation/display flows,
- adding a second and third game mode,
- adding per-game music players,
- improving accessibility and validation links across pages,
- documenting deployment and future roadmap expectations.

## Attribution
- Bootstrap 5.3.3: https://getbootstrap.com/
- Normalize.css 8.0.1: https://necolas.github.io/normalize.css/
- Bootstrap Icons: https://icons.getbootstrap.com/
- Compromise NLP (dating mode fallback analysis): https://github.com/spencermountain/compromise
- MDN localStorage/sessionStorage docs: https://developer.mozilla.org/
- AI usage: GitHub Copilot (GPT-5.3-Codex) for planning, refactoring, copyediting, and implementation support
- Inspiration/reference for music-player interaction pattern: https://github.com/codewithsadee/music-player
- Soyjak image source reference: Soybooru - https://soybooru.com/

Music credits (all tracks used in this project):
- Let It Sneed - realBabySneed
- Here Comes The Sneed - realBabySneed
- Gem Cobbity SMV - David Thougie
- King of CoalJak Posters - David Thoughie
- Gas Gas Gas - Manuel
- Running In The 90's - Max Coveri
- Tokyo Drift (Fast & Furious) - TERIYAKI BOYZ
- Bottomless Pit - Savoy
- I Hate That You're Happy - Tinylittlehouses
- No Children - The Mountain Goats
- Exile Vilify - The National

## Project Structure
Generated from current repository layout (depth ~2):

```text
game-project-main/
|-- index.html
|-- README.md
|-- html/
|   |-- chase-game.html
|   |-- dating-game.html
|   |-- drag-game.html
|   |-- login.html
|   |-- profile-creator.html
|   |-- profile.html
|   `-- signup.html
|-- images/
|   |-- background-imgs/
|   |-- feraljak-imgs/
|   |-- sneed-imgs/
|   |-- soyjak-imgs/
|   |-- soytan-imgs/
|   `-- wireframe.png
|-- music/
|   |-- chase-game-music/
|   |-- dating-game-music/
|   `-- drag-game-music/
|-- scripts/
|   |-- auth.js
|   |-- login.js
|   |-- music.js
|   |-- profile-creator.js
|   |-- profile.js
|   |-- signup.js
|   |-- storage.js
|   |-- chase-game/
|   |-- dating-game/
|   `-- drag-game/
`-- styles/
	|-- common.css
	|-- game.css
	`-- home.css
```

## Code Highlight
Snippet from the dating game remote AI request flow:

```js
const response = await fetch(endpoint, {
	method: "POST",
	headers,
	body: JSON.stringify(payload)
});
```

Why it matters:
- This is the app's fetch API + JSON packaging requirement in action.
- Player dialogue is converted into structured JSON and sent to an AI endpoint.
- The same architecture allows fallback/local behavior when no endpoint is configured.

How it works:
- `payload` is assembled from user input and conversation state.
- `JSON.stringify(payload)` serializes the object for transport.
- The response is parsed and rendered into the chat UI, updating game state.

## Future Improvements
Sprint 99 Milestone target:
- https://github.com/BasedBroski/final-project/milestones

Planned Sprint 99 issue themes:
- Improve mobile touch controls for chase mode.
- Add keyboard shortcuts and ARIA feedback improvements.
- Expand profile features (avatar presets + validation).
- Add server-backed auth/profile sync (optional backend phase).
- Address known UI consistency bugs across auth pages.

## Submission Notes
Required in repository About section:
- GitHub Pages deployed app link
- GCP External IP deployed app link
- Repository tags relevant to the project

Required in GitHub Profile README:
- Featured project name and short description
- Link to this repository
- Optional bonus: LinkedIn profile + networking requirements
