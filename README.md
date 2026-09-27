# Lord, Saint, Sinner — website

Static, dependency-free website for Lord, Saint, Sinner, an independent music company (label, publishing, management, live, studio, sync).

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: hero with an interactive 3D phone player (turns as you scroll; drag, swipe or arrow keys to spin it), roster, featured release, "Listen everywhere" streaming links, services, shows, journal, newsletter |
| `about.html` | Story, the logo and what it means, values, timeline, leadership team |
| `artists.html` | Roster with genre filter and artist spotlight |
| `releases.html` | Latest release tracklist, filterable catalogue, playlists |
| `services.html` | Six services, demo-to-debut process, FAQ |
| `events.html` | Filterable tour dates, Heatwave Festival, live formats |
| `news.html` | Journal with category filter and press kit |
| `contact.html` | Enquiry / demo form, studios, careers |
| `404.html` | Not-found page |

## Running locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Logos

- `assets/img/lss-badge.png`: circular badge (header, footer, favicon, about page)
- `assets/img/lss-wordmark.png`: red wordmark (footer, about page, press downloads)
- `assets/img/lss-wordmark-cream.png`: cream version used as the home hero watermark
- `assets/img/favicon.png`, `assets/img/apple-touch-icon.png`: generated from the badge

## Streaming links

Artist, release and playlist links to Spotify, Apple Music, YouTube Music, Audiomack, Boomplay, TIDAL, Deezer and Amazon Music are rendered by `listen_links()`. Until real profile URLs are added, each link opens a search for the artist or release on that platform.

## Notes

- Styles live in `assets/css/styles.css` and behaviour in `assets/js/main.js`.
- The player uses a small WebAudio synth as stand-in audio. Swap in real audio files when they're available.
- Artist portraits and cover art are generated with CSS/SVG. Replace them with real photography and artwork.
- Artists, releases, dates, addresses, emails and phone numbers are placeholder content.
- The forms validate in the browser only. Connect them to a backend or form service before launch.
