// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio'
import St from 'gi://St'

import { _BaseModule } from './_BaseModule.js'
import { Logger } from '../services/Logger.js'

/**
 * Dash to Dock Tweaks
 *
 * Simplifies Dash to Dock appearance by loading custom CSS
 */
export class DashToDockTweaks extends _BaseModule {
  #settings
  #extensionDir
  #themeContext
  #previousTheme
  #settingsConnection = null

  constructor (settings, extensionDir) {
    super()

    this.#settings = settings
    this.#extensionDir = extensionDir
    this.#previousTheme = null

    // Get theme context
    this.#themeContext = St.ThemeContext.get_for_stage(global.stage)
  }

  enable () {
    Logger.log(this.name, 'Enable called')

    // Connect to settings changes
    this.#settingsConnection = this.#settings.connect(
      'changed::enable-dash-to-dock-tweaks',
      () => this.#onSettingChanged()
    )

    // Apply initial state
    this.#onSettingChanged()

    Logger.log(`${this.name} enabled`)
  }

  disable () {
    Logger.log(this.name, 'Disable called')

    // Disconnect settings
    if (this.#settingsConnection) {
      this.#settings.disconnect(this.#settingsConnection)
      this.#settingsConnection = null
    }

    // Remove styles
    this.#removeStyles()

    Logger.log(`${this.name} disabled`)
  }

  #onSettingChanged () {
    const isEnabled = this.#settings.get_boolean('enable-dash-to-dock-tweaks')
    Logger.log(this.name, `Setting changed to: ${isEnabled}`)

    if (isEnabled) {
      this.#applyStyles()
    } else {
      this.#removeStyles()
    }
  }

  #applyStyles () {
    // Don't apply twice
    if (this.#previousTheme) {
      Logger.log(this.name, 'Styles already applied, skipping')
      return
    }

    Logger.log(this.name, 'Applying styles...')

    try {
      const theme = this.#themeContext.get_theme()

      const stylesheetPath = `${this.#extensionDir.get_path()}/assets/dash-to-dock-tweaks.css`
      Logger.log(this.name, `CSS path: ${stylesheetPath}`)

      const stylesheetFile = Gio.File.new_for_path(stylesheetPath)

      if (!stylesheetFile.query_exists(null)) {
        Logger.error(this.name, `File NOT found: ${stylesheetPath}`)
        return
      }

      theme.load_stylesheet(stylesheetFile)
      this.#previousTheme = theme

      Logger.log(this.name, 'CSS applied!')
    } catch (error) {
      Logger.error(this.name, `ERROR: ${error}`)
      Logger.error(this.name, `Stack: ${error.stack}`)
    }
  }

  #removeStyles () {
    if (!this.#previousTheme) {
      Logger.log(this.name, 'No styles to remove')
      return
    }

    Logger.log(this.name, 'Removing styles...')

    try {
      const stylesheetPath = `${this.#extensionDir.get_path()}/assets/dash-to-dock-tweaks.css`
      const stylesheetFile = Gio.File.new_for_path(stylesheetPath)

      this.#previousTheme.unload_stylesheet(stylesheetFile)
      this.#previousTheme = null

      Logger.log(this.name, 'CSS removed!')
    } catch (error) {
      Logger.error(this.name, `Error: ${error}`)
    }
  }
}
