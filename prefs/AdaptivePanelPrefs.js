// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

export class AdaptivePanelPrefs {
    static buildPrefsGroup(settings) {
        const group = new Adw.PreferencesGroup({
            title: 'Adaptive Panel',
            description: 'Panel appearance based on wallpaper analysis',
        });

        // Panel mode selection
        const modeRow = new Adw.ComboRow({
            title: 'Mode',
            subtitle: 'Automatic uses wallpaper analysis',
            model: new Gtk.StringList({
                strings: [
                    'Automatic',
                    'Dark',
                    'Light',
                    'Translucent Dark',
                    'Translucent Light',
                ],
            }),
        });

        const currentMode = settings.get_string('panel-mode');
        const modeMap = {
            'automatic': 0,
            'dark': 1,
            'light': 2,
            'translucent-dark': 3,
            'translucent-light': 4,
        };
        const reverseModeMap = ['automatic', 'dark', 'light', 'translucent-dark', 'translucent-light'];

        modeRow.set_selected(modeMap[currentMode] || 0);
        modeRow.connect('notify::selected', (widget) => {
            settings.set_string('panel-mode', reverseModeMap[widget.selected]);
        });

        group.add(modeRow);

        // Luminance threshold
        const luminanceRow = new Adw.SpinRow({
            title: 'Luminance Threshold',
            subtitle: 'Lower values make more wallpapers appear "dark"',
            adjustment: new Gtk.Adjustment({
                lower: 0.0,
                upper: 1.0,
                step_increment: 0.005,
                page_increment: 0.05,
            }),
            digits: 3,
        });

        luminanceRow.set_value(settings.get_double('luminance-threshold'));
        luminanceRow.connect('notify::value', (widget) => {
            settings.set_double('luminance-threshold', widget.value);
        });

        group.add(luminanceRow);

        return group;
    }
}
