// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { _BaseModule } from './_BaseModule.js';
import { Logger } from '../utils/Logger.js';

/**
 * RoundedCorners module - adds rounded corners to screen edges
 */
export class RoundedCorners extends _BaseModule {
    #settings;
    #corners = {};
    #monitorListener = null;
    #extensionDir;

    constructor(settings, extensionDir) {
        super('RoundedCorners');
        this.#settings = settings;
        this.#extensionDir = extensionDir;
    }

    enable() {
        super.enable();

        // Listen for corner radius changes
        this.#settings.connect('changed::corner-radius', () => this.#draw());

        // Monitor changes to redraw corners
        this.#monitorListener = Gio.DBus.session.signal_subscribe(
            'org.gnome.Mutter.DisplayConfig',
            'org.gnome.Mutter.DisplayConfig',
            'MonitorsChanged',
            '/org/gnome/Mutter/DisplayConfig',
            null,
            Gio.DBusSignalFlags.NONE,
            () => this.#draw()
        );

        // Draw corners initially
        this.#draw();
    }

    disable() {
        super.disable();

        // Cleanup monitor listener
        if (this.#monitorListener) {
            Gio.DBus.session.signal_unsubscribe(this.#monitorListener);
            this.#monitorListener = null;
        }

        // Destroy all corners
        this.#destroy();
    }

    #draw() {
        // Destroy existing corners first
        this.#destroy();

        const radius = this.#settings.get_int('corner-radius');
        const cornerDir = this.#extensionDir.get_child('assets').get_child('corners').get_path();

        Logger.debug(this.name, `Drawing corners with radius ${radius}px`);

        for (let monitor of Main.layoutManager.monitors) {
            let geometryScale = monitor.geometry_scale || 1;

            for (let corner of ['tl', 'tr', 'bl', 'br']) {
                let x = monitor.x + ((corner[1] == 'l') ? 0 : monitor.width - geometryScale * radius);
                let y = monitor.y + ((corner[0] == 't') ? 0 : monitor.height - geometryScale * radius);

                let cornerDecoration = this.#corners[`${monitor.index}-${corner}`] = new St.Bin({
                    style_class: `corner-decoration corner-{${corner}}`,
                    reactive: false,
                    x, y,
                    width: geometryScale * radius,
                    height: geometryScale * radius,
                    can_focus: false,
                    track_hover: false,
                    style: `
                        background-image: url("${cornerDir}/corner-${corner}.svg");
                        background-size: contain;
                    `
                });

                Main.uiGroup.add_child(cornerDecoration);
            }
        }

        Logger.debug(this.name, `Drawn ${Object.keys(this.#corners).length} corners`);
    }

    #destroy() {
        for (let corner of Object.values(this.#corners)) {
            corner.destroy();
        }
        this.#corners = {};
    }
}
