# Customer display: setup

The customer display (`src/cashier/display/customer-display.html`) mirrors the terminal through `localStorage`
(`pos_cfd`). Two things follow from that, and both shape the setup:

1. The terminal and the display must run in the **same browser profile**, or the display never sees the sale.
2. A browser only allows fullscreen after a tap, click or key press **inside the window that goes fullscreen**. The
   terminal cannot make the display fullscreen by sending a command.

## Option A: from the terminal (simple, normal use)

The default way to use the display. No setup, nothing to install.

1. In the terminal, open the cashier menu and choose «បើកអេក្រង់អតិថិជន».
2. First time only: allow the browser's «គ្រប់គ្រងបង្អួច» (window management) prompt. With a second monitor
   connected, the window moves there and fills it. Without the permission or a second monitor it opens as a normal window.
3. Tap or click the customer screen once. It goes fullscreen. Esc exits, and the next tap re-enters.
4. The same menu item reads «បិទអេក្រង់អតិថិជន» while the display is open, and closes it.

The tap in step 3 is needed once per open, so do it at the start of the shift.

Needs a Chromium browser (Chrome, Edge) for the second-monitor placement. Other browsers open a normal window.
Popups must be allowed for the site, or the terminal shows a warning toast.

## Hiding the address bar

A web page cannot hide the address bar of a popup window; browsers always show it. Two ways to remove it:

- **Install the display as an app (easiest, no command line).** Open the display page in Chrome or Edge, then use
  the install icon in the address bar (or menu → «Cast, save and share» → «Install page as app»). The display
  has a web app manifest (`manifest.webmanifest`, `display: fullscreen`), so the installed app opens fullscreen
  with no address bar. It uses the same browser profile, so it still sees the terminal's data. Move its window to the customer
  monitor once; Chrome remembers the position. The app window is not opened by the terminal's menu toggle: launch it from the
  desktop shortcut or the Chrome apps page, and close it with its own window controls.
- **Kiosk mode** (Option B below).

## Option B: kiosk mode on the customer's monitor (optional, advanced)

A shortcut starts the browser fullscreen on the second monitor. No tap and no permission prompt, and no address bar
visible to customers.

Windows shortcut target (Chrome):

```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --user-data-dir="C:\pos-profile" --window-position=1920,0 --app=https://<site>/cashier/display/customer-display.html
```

- `--window-position=1920,0`: the top-left corner of the second monitor. `1920` assumes the main screen is 1920 px wide.
  Put the display monitor to the right of the main one in Windows display settings.
- `--user-data-dir`: **use the same folder in the terminal's shortcut**, so both windows share one profile
  and one `localStorage`. Start the terminal first and sign in. The display needs the session.
- Put the display shortcut in the Windows Startup folder if it should come back after a power cut.
- macOS: the same flags via
  `open -na "Google Chrome" --args --kiosk --user-data-dir=$HOME/pos-profile --window-position=1920,0 --app=<url>`.

**Not yet tested on a shop PC.** The known risk is that Chrome, when the profile is already running, may hand the
second launch to the existing instance and ignore `--kiosk` or `--window-position`. Check this on the real machine
before relying on it. If it happens, fall back to Option A, or run the terminal in its own Chrome profile and
use the same profile only for the display.

## What the display needs to work

- Same origin and profile as the terminal (above).
- A signed-in session in that profile (`pos_session`). The display page is guarded like other `cashier/*` pages, with the
  owner allowed in for previews.
- It falls back to the idle screen after 30 seconds without an update from the terminal (the terminal sends a
  heartbeat every 10 seconds), so a closed terminal never leaves a stale sale on show.

## Idle messages

The manager or owner edits up to 5 idle messages (text, icon, on/off) in settings → «អេក្រង់អតិថិជន». The page has a
preview and a button that opens the display.

## Not planned

- A remote fullscreen button: the browser blocks it.
- Tips, loyalty prompts and receipt-by-phone: they need new rules and a backend.
