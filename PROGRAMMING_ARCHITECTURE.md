# StanNet Programming Academy — Architecture

The Programming Academy is intentionally split into four layers.

## 1. Core

These files define the academy shell and top-level curriculum:

- `programming-academy.css`
- `programming-curriculum.js`
- `programming-academy.js`

Entry page: `pages/programming.html`.

## 2. Labs

Interactive execution environments:

- `programming-lab.css`
- `programming-lab.js` — Python lab
- `programming-web-lab.js` — HTML/CSS/JavaScript lab
- `programming-cs-lab.js` — Computer Science lab
- `programming-campus.css`
- `programming-campus.js`

Entry pages:

- `pages/programming-lab.html`
- `pages/programming-web-lab.html`
- `pages/programming-cs-lab.html`
- `pages/programming-fullstack-course.html`

## 3. Content

Curriculum and theory data consumed by the labs:

- `programming-python-lessons.js`
- `programming-web-lessons.js`
- `programming-cs-lessons.js`
- `programming-html-css-deep-theory.js`
- `programming-javascript-complete.js`
- `programming-javascript-deep-theory.js`
- `programming-javascript-mastery.js`
- `programming-javascript-reference-gaps.js`
- `programming-javascript-theory-v4.js`

The JavaScript exercise checker has one canonical implementation:

- `programming-javascript-autograder.js`

Do not reintroduce versioned variants such as `*-v2.js`.

## 4. Full-stack extensions

The full-stack route is additive. The load order matters because later layers enrich data created by earlier layers.

Base map:

- `programming-fullstack.js`

Theory/content layers:

- `programming-fullstack-deep-content.js`
- `programming-fullstack-textbook.js`
- `programming-fullstack-theory-complete.js`
- `programming-fullstack-foundations.js`
- `programming-fullstack-completion.js`
- `programming-fullstack-fs01-chapters.js`
- `programming-fullstack-fs02-fs03-chapters.js`
- `programming-fullstack-fs04-fs05-chapters.js`
- `programming-fullstack-courseware.js`

Runtime/UI:

- `programming-fullstack-engine.js`
- `programming-campus.js`

## Rules

1. Pages must load the canonical `programming-academy.css`.
2. Web Lab must load the canonical `programming-javascript-autograder.js`.
3. Data/content scripts load before the UI/runtime that consumes them.
4. Do not add version suffixes to active production assets. Replace the canonical file instead.
5. A file is removed only after confirming no active page or test depends on it.
