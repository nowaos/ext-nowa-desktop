// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { DesktopPrefs } from './src/prefs/DesktopPrefs.js';
import { ThemePrefs } from './src/prefs/ThemePrefs.js';
import { WallpaperPrefs } from './src/prefs/WallpaperPrefs.js';

export default class NowaDesktopPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    // Add all preference pages
    window.add(DesktopPrefs.buildPage(settings));
    window.add(ThemePrefs.buildPage(settings));
    window.add(WallpaperPrefs.buildPage(settings));
  }
}
