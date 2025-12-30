// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

export class LiveWallpaperPrefs {
    static buildPrefsGroup(settings) {
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

        // API Key
        const apiKeyRow = new Adw.PasswordEntryRow({
            title: 'Unsplash API Key',
        });

        apiKeyRow.set_text(settings.get_string('unsplash-api-key'));
        apiKeyRow.connect('changed', (widget) => {
            settings.set_string('unsplash-api-key', widget.get_text());
        });

        group.add(apiKeyRow);

        // Keywords
        const keywordsRow = new Adw.EntryRow({
            title: 'Search Keywords',
            subtitle: 'Comma-separated (e.g., nature, landscape, minimal)',
        });

        keywordsRow.set_text(settings.get_string('wallpaper-keywords'));
        keywordsRow.connect('changed', (widget) => {
            settings.set_string('wallpaper-keywords', widget.get_text());
        });

        group.add(keywordsRow);

        // Refresh button
        const refreshButton = new Gtk.Button({
            label: 'Refresh Wallpaper Now',
            halign: Gtk.Align.CENTER,
            margin_top: 12,
            css_classes: ['suggested-action'],
        });

        refreshButton.connect('clicked', () => {
            const timestamp = new Date().toISOString();
            settings.set_string('last-wallpaper-change', `force-refresh-${timestamp}`);
        });

        const buttonRow = new Adw.ActionRow();
        buttonRow.set_child(refreshButton);
        group.add(buttonRow);

        return group;
    }
}
