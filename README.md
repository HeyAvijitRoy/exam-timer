# Exam Countdown

[![Demo](https://img.shields.io/badge/Live-Demo-blue?logo=github&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A simple, dark-mode exam countdown timer you can customize without editing source files. Designed for projecting during exams — editable title, duration and rules are saved in localStorage.

## Features

- Editable exam title and subtitle (double-click)
- Editable rules and duration via Settings modal
- Supports duration input in `minutes` (e.g. `30`) or `minutes:seconds` (e.g. `0:30`, `1:30`)
- Sounds for warning, danger, and time-up
- Fullscreen button for projecting
- Local persistence via `localStorage`
- Clean, dark UI optimized for projection

## Tech Stack

- Plain HTML, CSS and JavaScript — no build step or dependencies
- Single-page: `index.html`, `css/styles.css`, `js/script.js`

## Usage

1. Open `index.html` in a browser (or host it on GitHub Pages).
2. Double-click the title or subtitle to edit text inline.
3. Double-click the big timer or click the ✎ button in the rules box to open Settings.
4. In Settings, set Duration as either `30` (minutes) or `0:30` (30 seconds), and edit rules (one per line).
5. Click `Start Exam` to begin. Use `Reset` to return the timer to the configured starting duration.

Notes:
- Sounds will trigger once when the timer hits the configured warning and danger thresholds and at 00:00.

## Customization

- Colors: edit `css/styles.css` — root variables are at the top (`--bg`, `--fg`, `--accent`, etc.).
- Change the footer link color for better projection contrast by updating `.pill a` color (e.g. `#00ffcc`).

Example recommended color to improve projection visibility:

```css
.pill a { color: #00ffcc; text-decoration: none; }
.pill a:hover { text-decoration: underline; }
```

## Contributing

Small fixes and improvements are welcome. If you add features, please keep it dependency-free unless necessary.

## Connect With Me

[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/HeyAvijitRoy/)
[![Website](https://img.shields.io/badge/-avijitroy.com-000000?style=flat&logo=githubpages&logoColor=white)](https://avijitroy.com)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

_“I build tools that solve real problems — secure, fast, and privacy-first.”_

Built with ❤️ in NYC by [Avijit Roy](https://avijitroy.com). Crafted in idle time 🌀