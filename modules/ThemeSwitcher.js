// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { Module } from './Module.js';
import { Logger } from '../utils/Logger.js';

/**
 * ThemeSwitcher module - automatically switches between light/dark theme based on time
 */
export class ThemeSwitcher extends Module {
    #settings;
    #interfaceSettings;
    #interfaceSettingsConnection = null;
    #themeCheckTimer = null;
    #manuallySetTheme = false;
    #settingsConnections = [];

    constructor(settings) {
        super('ThemeSwitcher');
        this.#settings = settings;
    }

    enable() {
        super.enable();

        const enabled = this.#settings.get_boolean('enable-auto-theme');

        if (!enabled) {
            Logger.debug(this.name, 'Auto theme is disabled');
            return;
        }

        // Get GNOME interface settings
        this.#interfaceSettings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.interface'
        });

        // Listen for manual theme changes
        this.#interfaceSettingsConnection = this.#interfaceSettings.connect('changed::color-scheme', () => {
            this.#manuallySetTheme = true;
            Logger.debug(this.name, 'Manual theme change detected');
        });

        // Listen for sunrise/sunset time changes
        this.#settingsConnections.push(
            this.#settings.connect('changed::sunrise-time', () => {
                Logger.debug(this.name, `Sunrise time changed to ${this.#settings.get_string('sunrise-time')}`);
                this.#checkAndApply();
            })
        );

        this.#settingsConnections.push(
            this.#settings.connect('changed::sunset-time', () => {
                Logger.debug(this.name, `Sunset time changed to ${this.#settings.get_string('sunset-time')}`);
                this.#checkAndApply();
            })
        );

        // Check immediately
        this.#checkAndApply();

        // Check every minute
        this.#themeCheckTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, () => {
            this.#checkAndApply();
            return GLib.SOURCE_CONTINUE;
        });

        const now = new Date();
        Logger.debug(this.name, `Setup complete - Sunrise: ${this.#settings.get_string('sunrise-time')}, Sunset: ${this.#settings.get_string('sunset-time')}, Current: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
    }

    disable() {
        super.disable();

        // Remove timer
        if (this.#themeCheckTimer) {
            GLib.Source.remove(this.#themeCheckTimer);
            this.#themeCheckTimer = null;
        }

        // Disconnect interface settings
        if (this.#interfaceSettingsConnection && this.#interfaceSettings) {
            this.#interfaceSettings.disconnect(this.#interfaceSettingsConnection);
            this.#interfaceSettingsConnection = null;
        }

        // Disconnect settings connections
        this.#settingsConnections.forEach(id => this.#settings.disconnect(id));
        this.#settingsConnections = [];

        this.#interfaceSettings = null;
        this.#manuallySetTheme = false;
    }

    #checkAndApply() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // Parse sunrise time (HH:MM)
        const sunriseTime = this.#settings.get_string('sunrise-time');
        const [sunriseHour, sunriseMinute] = sunriseTime.split(':').map(n => parseInt(n));
        const sunriseInMinutes = sunriseHour * 60 + sunriseMinute;

        // Parse sunset time (HH:MM)
        const sunsetTime = this.#settings.get_string('sunset-time');
        const [sunsetHour, sunsetMinute] = sunsetTime.split(':').map(n => parseInt(n));
        const sunsetInMinutes = sunsetHour * 60 + sunsetMinute;

        // Determine if it's day or night
        const isDayTime = currentTimeInMinutes >= sunriseInMinutes && currentTimeInMinutes < sunsetInMinutes;

        const currentTheme = this.#interfaceSettings.get_string('color-scheme');
        const targetTheme = isDayTime ? 'default' : 'prefer-dark';

        // If manually set, only change if we crossed a transition time
        if (this.#manuallySetTheme) {
            // Check if we just crossed sunrise or sunset
            const lastCheckMinutes = currentTimeInMinutes - 1;

            const crossedSunrise = lastCheckMinutes < sunriseInMinutes && currentTimeInMinutes >= sunriseInMinutes;
            const crossedSunset = lastCheckMinutes < sunsetInMinutes && currentTimeInMinutes >= sunsetInMinutes;

            if (crossedSunrise || crossedSunset) {
                this.#manuallySetTheme = false;
                Logger.debug(this.name, 'Transition time reached, resetting manual flag');
            } else {
                // Respect manual choice
                return;
            }
        }

        if (currentTheme !== targetTheme) {
            // Temporarily disconnect listener to avoid triggering manual flag
            if (this.#interfaceSettingsConnection) {
                this.#interfaceSettings.disconnect(this.#interfaceSettingsConnection);
            }

            this.#interfaceSettings.set_string('color-scheme', targetTheme);

            // Reconnect listener
            if (this.#settings.get_boolean('enable-auto-theme')) {
                this.#interfaceSettingsConnection = this.#interfaceSettings.connect('changed::color-scheme', () => {
                    this.#manuallySetTheme = true;
                    Logger.debug(this.name, 'Manual theme change detected');
                });
            }

            Logger.log(`Theme switched to ${targetTheme === 'prefer-dark' ? 'Dark' : 'Light'} (${currentHour}:${currentMinute.toString().padStart(2, '0')})`);
        }
    }
}
