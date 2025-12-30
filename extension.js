// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { AdaptivePanel } from './modules/AdaptivePanel.js';
import { RoundedCorners } from './modules/RoundedCorners.js';
import { ThemeSwitcher } from './modules/ThemeSwitcher.js';
import { LiveWallpaper } from './modules/LiveWallpaper.js';
import { Logger } from './utils/Logger.js';

/**
 * Nowa Desktop - A complete desktop enhancement extension
 *
 * Features:
 * - Adaptive top bar based on wallpaper analysis
 * - Rounded screen corners
 * - Automatic theme switching (sunrise/sunset)
 * - Live wallpaper from Unsplash
 */
export default class NowaDesktopExtension extends Extension {
    #modules = [];

    enable() {
        Logger.log('=== Extension Enabling ===');

        const settings = this.getSettings();

        // Initialize all modules
        this.#modules = [
            new AdaptivePanel(settings),
            new RoundedCorners(settings, this.dir),
            new ThemeSwitcher(settings),
            new LiveWallpaper(settings),
        ];

        // Enable all modules
        this.#modules.forEach(module => {
            try {
                module.enable();
            } catch (error) {
                Logger.error(`Failed to enable ${module.name}: ${error.message}`);
            }
        });

        Logger.log('=== Extension Enabled ===');
    }

    disable() {
        Logger.log('=== Extension Disabling ===');

        // Disable all modules in reverse order
        this.#modules.reverse().forEach(module => {
            try {
                module.disable();
            } catch (error) {
                Logger.error(`Failed to disable ${module.name}: ${error.message}`);
            }
        });

        this.#modules = [];

        Logger.log('=== Extension Disabled ===');
    }
}
