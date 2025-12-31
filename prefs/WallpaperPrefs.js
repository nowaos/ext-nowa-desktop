// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

/**
 * Wallpaper preferences page - Live Wallpaper from Unsplash
 */
export class WallpaperPrefs {
    static buildPage(settings) {
        const page = new Adw.PreferencesPage({
            title: 'Wallpaper',
            icon_name: 'preferences-desktop-wallpaper-symbolic',
        });

        const group = new Adw.PreferencesGroup({
            title: 'Daily Wallpaper from Unsplash',
            description: 'Fetches a new wallpaper every day',
        });

        // Enable toggle
        const enableRow = new Adw.SwitchRow({
            title: 'Enable Live Wallpaper',
            subtitle: 'Download daily wallpapers from Unsplash',
        });

        enableRow.set_active(settings.get_boolean('enable-live-wallpaper'));
        enableRow.connect('notify::active', (widget) => {
            settings.set_boolean('enable-live-wallpaper', widget.active);
        });

        group.add(enableRow);

        // API Key - normal entry (not masked)
        const apiKeyRow = new Adw.EntryRow({
            title: 'Unsplash API Key',
        });

        apiKeyRow.set_text(settings.get_string('unsplash-api-key'));
        apiKeyRow.connect('changed', (widget) => {
            settings.set_string('unsplash-api-key', widget.get_text());
        });

        group.add(apiKeyRow);

        // Keywords - use ActionRow with subtitle
        const keywordsRow = new Adw.ActionRow({
            title: 'Search Keywords',
            subtitle: 'Comma-separated (e.g., nature, landscape, minimal)',
        });

        const keywordsEntry = new Gtk.Entry({
            valign: Gtk.Align.CENTER,
            hexpand: true,
        });

        keywordsEntry.set_text(settings.get_string('wallpaper-keywords'));
        keywordsEntry.connect('changed', (widget) => {
            settings.set_string('wallpaper-keywords', widget.get_text());
        });

        keywordsRow.add_suffix(keywordsEntry);
        keywordsRow.activatable_widget = keywordsEntry;

        group.add(keywordsRow);

        // Refresh wallpaper row - title left, button right
        const refreshRow = new Adw.ActionRow({
            title: 'Refresh Wallpaper',
            subtitle: 'Download a new wallpaper immediately',
        });

        const refreshButton = new Gtk.Button({
            label: 'Refresh',
            valign: Gtk.Align.CENTER,
        });

        refreshButton.connect('clicked', () => {
            const timestamp = new Date().toISOString();
            settings.set_string('last-wallpaper-change', `force-refresh-${timestamp}`);
        });

        refreshRow.add_suffix(refreshButton);
        refreshRow.activatable_widget = refreshButton;

        group.add(refreshRow);

        page.add(group);

        return page;
    }
}
