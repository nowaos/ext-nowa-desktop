import Adw from 'gi://Adw';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { AdaptivePanelPrefs } from './prefs/AdaptivePanelPrefs.js';
import { RoundedCornersPrefs } from './prefs/RoundedCornersPrefs.js';
import { ThemeSwitcherPrefs } from './prefs/ThemeSwitcherPrefs.js';
import { LiveWallpaperPrefs } from './prefs/LiveWallpaperPrefs.js';

export default class NowaDesktopPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    // === DESKTOP PAGE ===
    const desktopPage = new Adw.PreferencesPage({
      title: 'Desktop',
      icon_name: 'video-display-symbolic',
    });

    desktopPage.add(AdaptivePanelPrefs.buildPrefsGroup(settings));
    desktopPage.add(RoundedCornersPrefs.buildPrefsGroup(settings));

    window.add(desktopPage);

    // === THEME PAGE ===
    const themePage = new Adw.PreferencesPage({
      title: 'Theme',
      icon_name: 'preferences-desktop-theme-symbolic',
    });

    themePage.add(ThemeSwitcherPrefs.buildPrefsGroup(settings));

    window.add(themePage);

    // === WALLPAPER PAGE ===
    const wallpaperPage = new Adw.PreferencesPage({
      title: 'Wallpaper',
      icon_name: 'preferences-desktop-wallpaper-symbolic',
    });

    wallpaperPage.add(LiveWallpaperPrefs.buildPrefsGroup(settings));

    window.add(wallpaperPage);
  }
}
