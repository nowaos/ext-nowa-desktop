// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';

/**
 * Theme preferences page - Auto Theme Switcher
 */
export class ThemePrefs {
    static buildPage(settings) {
        const page = new Adw.PreferencesPage({
            title: 'Theme',
            icon_name: 'weather-clear-night-symbolic',
        });

        const group = new Adw.PreferencesGroup({
            title: 'Auto Theme Switcher',
            description: 'Automatically switch between light/dark themes',
        });

        // Enable toggle
        const enableRow = new Adw.SwitchRow({
            title: 'Enable Auto Theme',
            subtitle: 'Switch theme based on time of day',
        });

        enableRow.set_active(settings.get_boolean('enable-auto-theme'));
        enableRow.connect('notify::active', (widget) => {
            settings.set_boolean('enable-auto-theme', widget.active);
        });

        group.add(enableRow);

        // Sunrise time
        const sunriseRow = new Adw.EntryRow({
            title: 'Sunrise Time',
        });

        sunriseRow.set_text(settings.get_string('sunrise-time'));
        sunriseRow.connect('changed', (widget) => {
            let text = widget.get_text().trim();
            
            // Accept HHMM format and convert to HH:MM
            if (/^[0-2][0-9][0-5][0-9]$/.test(text)) {
                text = text.substring(0, 2) + ':' + text.substring(2);
                widget.set_text(text);
            }
            
            // Validate HH:MM format
            if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(text)) {
                settings.set_string('sunrise-time', text);
            }
        });

        group.add(sunriseRow);

        // Sunset time
        const sunsetRow = new Adw.EntryRow({
            title: 'Sunset Time',
        });

        sunsetRow.set_text(settings.get_string('sunset-time'));
        sunsetRow.connect('changed', (widget) => {
            let text = widget.get_text().trim();
            
            // Accept HHMM format and convert to HH:MM
            if (/^[0-2][0-9][0-5][0-9]$/.test(text)) {
                text = text.substring(0, 2) + ':' + text.substring(2);
                widget.set_text(text);
            }
            
            // Validate HH:MM format
            if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(text)) {
                settings.set_string('sunset-time', text);
            }
        });

        group.add(sunsetRow);

        page.add(group);

        return page;
    }
}
