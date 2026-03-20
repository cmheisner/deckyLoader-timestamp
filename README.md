# Timestamp

A [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin that displays a persistent clock and date overlay on your Steam Deck screen — visible during gameplay.

## Features

- Clock overlay visible at all times, even during games
- Toggle clock on/off
- 12-hour or 24-hour format
- Optional date display (e.g. `Fri, Mar 20`)
- Adjustable font size (10–36px)
- Color picker: White, Yellow, Green, Cyan, Orange, Pink
- Four corner positions: top-left, top-right, bottom-left, bottom-right
- Settings saved automatically

## Installation

### Via Decky Store (recommended)
Install through the Decky Loader plugin store once approved.

### Manual
1. Download the latest release
2. Extract to `~/homebrew/plugins/Timestamp`
3. Restart Decky Loader

## Development

**Requirements:** Node.js (via nvm), Python 3

```bash
# Install dependencies
npm install

# Build and install to Steam Deck
./install.sh
```

After installing, reload Decky via **QAM → Decky → ··· → Reload**.

## License

CC0 1.0 Universal — see [LICENSE](LICENSE)
