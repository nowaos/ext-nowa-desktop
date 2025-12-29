# Nowa Desktop

A complete desktop enhancement extension for GNOME Shell 48, featuring adaptive panel styling,
rounded corners, automatic theme switching, and live wallpapers.

## Features

### Adaptive Top Bar
Automatically adjusts panel style based on wallpaper analysis:
- **Dark mode**: Light panel on dark wallpapers
- **Light mode**: Dark panel on light wallpapers
- **Translucent modes**: Semi-transparent with blur
- **Maximized mode**: Solid black when window is maximized

### Rounded Corners
macOS-style rounded screen corners with configurable radius (0-32px).

### Auto Theme Switcher
Automatically switches between light/dark themes based on sunrise/sunset times:
- Configure custom times (HH:MM format)
- Respects manual theme changes
- Only switches at transition times

### Live Wallpaper
Daily wallpapers from Unsplash:
- Fetches new wallpaper daily at 6 AM
- Configurable search keywords
- Manual refresh button
- Requires Unsplash API key (free)

## Installation

```bash
chmod +x bin/install.sh
./bin/install.sh
```

## Configuration

Run preferences:
```bash
gnome-extensions prefs nowa-desktop@extensions.gnome.org
```

## Development

### Code Style
This project uses EditorConfig for consistent formatting:
- 2 spaces for indentation
- LF line endings
- UTF-8 encoding

### Debug Logs
```bash
./bin/debug.sh
```

### Uninstall
```bash
./bin/uninstall.sh
```

## Buy Me a Coffee

If you enjoy this extension, consider supporting the development:

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate/?hosted_button_id=KQXTZ4MH4JRZU)

## Bug Reports & Feature Requests

Please use the [issue tracker](https://github.com/yourusername/nowa-desktop/issues) to report any bugs or file feature requests.

## Contributing

See [AUTHORS](AUTHORS) for a list of contributors and acknowledgments.

## License

[GPL-3.0-or-later](https://www.gnu.org/licenses/gpl-3.0.html)

Copyright (c) 2024-present, Nowa Desktop Contributors
