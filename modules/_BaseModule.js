// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import { Logger } from '../utils/Logger.js';

/**
 * Base class for all Nowa Desktop modules
 */
export class _BaseModule {
    #name;

    constructor(name) {
        this.#name = name;
    }

    enable() {
        Logger.debug(this.#name, 'Enabling...');
    }

    disable() {
        Logger.debug(this.#name, 'Disabling...');
    }

    get name() {
        return this.#name;
    }
}
