// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { _BaseModule } from './_BaseModule.js';
import { Logger } from '../utils/Logger.js';
import { UnsplashAPI } from '../services/UnsplashAPI.js';

const BACKGROUND_KEY = 'picture-uri';
const BACKGROUND_KEY_DARK = 'picture-uri-dark';

/**
 * LiveWallpaper module - downloads daily wallpapers from Unsplash
 */
export class LiveWallpaper extends _BaseModule {
    #settings;
    #backgroundSettings;
    #wallpaperCheckTimer = null;
    #settingsConnections = [];

    constructor(settings) {
        super('LiveWallpaper');
        this.#settings = settings;
        this.#backgroundSettings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.background'
        });
    }

    enable() {
        super.enable();

        const enabled = this.#settings.get_boolean('enable-live-wallpaper');

        if (!enabled) {
            Logger.debug(this.name, 'Live wallpaper is disabled');
            return;
        }

        // Check on enable
        this.#checkAndUpdate();

        // Setup 6 AM timer (check every hour)
        this.#wallpaperCheckTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3600, () => {
            const now = new Date();
            if (now.getHours() === 6) {
                this.#checkAndUpdate();
            }
            return GLib.SOURCE_CONTINUE;
        });

        // Listen for force refresh
        this.#settingsConnections.push(
            this.#settings.connect('changed::last-wallpaper-change', () => {
                const value = this.#settings.get_string('last-wallpaper-change');
                if (value.startsWith('force-refresh-')) {
                    Logger.debug(this.name, 'Force refresh triggered');
                    this.#update();
                }
            })
        );

        Logger.debug(this.name, 'Setup complete');
    }

    disable() {
        super.disable();

        if (this.#wallpaperCheckTimer) {
            GLib.Source.remove(this.#wallpaperCheckTimer);
            this.#wallpaperCheckTimer = null;
        }

        this.#settingsConnections.forEach(id => this.#settings.disconnect(id));
        this.#settingsConnections = [];
    }

    #checkAndUpdate() {
        const today = new Date().toISOString().split('T')[0];
        const lastChange = this.#settings.get_string('last-wallpaper-change');

        if (lastChange !== today) {
            Logger.debug(this.name, `Needs update (last: ${lastChange}, today: ${today})`);
            this.#update();
        }
    }

    async #update() {
        const apiKey = this.#settings.get_string('unsplash-api-key');

        if (!apiKey || apiKey === '') {
            Logger.debug(this.name, 'No Unsplash API key configured');
            return;
        }

        try {
            // Use UnsplashAPI service (SRP + DIP: Dependency Inversion Principle)
            const unsplash = new UnsplashAPI(apiKey);

            const keywords = this.#settings.get_string('wallpaper-keywords');
            const photo = await unsplash.getRandomPhoto({
                orientation: 'landscape',
                query: keywords
            });

            Logger.debug(this.name, `Downloading wallpaper: ${photo.id}`);

            const imageBytes = await unsplash.downloadImage(photo.urls.raw, 3840, 85);

            // Save to cache
            const cacheDir = GLib.build_filenamev([GLib.get_user_cache_dir(), 'nowa-desktop']);
            GLib.mkdir_with_parents(cacheDir, 0o755);

            const filename = `wallpaper-${photo.id}.jpg`;
            const filepath = GLib.build_filenamev([cacheDir, filename]);

            const file = Gio.File.new_for_path(filepath);
            file.replace_contents(
                imageBytes,
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );

            // Set as wallpaper
            const fileUri = `file://${filepath}`;
            this.#backgroundSettings.set_string(BACKGROUND_KEY, fileUri);
            this.#backgroundSettings.set_string(BACKGROUND_KEY_DARK, fileUri);

            // Update last change date
            const today = new Date().toISOString().split('T')[0];
            this.#settings.set_string('last-wallpaper-change', today);

            Logger.log(`Wallpaper updated successfully (${photo.id})`);

        } catch (error) {
            Logger.error(`Failed to update wallpaper: ${error.message}`);
        }
    }

    /**
     * Builds preferences group for Live Wallpaper settings
     * @param {Gio.Settings} settings - Extension settings
     * @returns {Adw.PreferencesGroup}
     */
    static buildPrefsGroup(settings) {
        const Adw = imports.gi.Adw;
        const Gtk = imports.gi.Gtk;
        const GLib = imports.gi.GLib;

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
