// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

export class RoundedCornersPrefs {
    static buildPrefsGroup(settings) {
        const group = new Adw.PreferencesGroup({
            title: 'Rounded Corners',
            description: 'Screen corner radius',
        });

        const radiusRow = new Adw.SpinRow({
            title: 'Corner Radius',
            subtitle: 'Radius in pixels (0 to disable)',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 32,
                step_increment: 1,
                page_increment: 4,
            }),
            digits: 0,
        });

        radiusRow.set_value(settings.get_int('corner-radius'));
        radiusRow.connect('notify::value', (widget) => {
            settings.set_int('corner-radius', widget.value);
        });

        group.add(radiusRow);

        return group;
    }
}
