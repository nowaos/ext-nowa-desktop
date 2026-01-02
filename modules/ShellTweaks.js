// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import * as WorkspaceSwitcherPopup from 'resource:///org/gnome/shell/ui/workspaceSwitcherPopup.js'
import * as WindowPreview from 'resource:///org/gnome/shell/ui/windowPreview.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import { ControlsState } from 'resource:///org/gnome/shell/ui/overviewControls.js'

import { _BaseModule } from './_BaseModule.js'
import { Logger } from '../utils/Logger.js'

/**
* ShellTweaks - Various GNOME Shell UI tweaks
*/
export class ShellTweaks extends _BaseModule {
  #settings
  #originals = {}
  #startupCompleteSignal = null

  constructor (settings) {
    super()

    this.#settings = settings
  }

  enable () {
    super.enable()

    // Disable workspace popup
    this.#disableWorkspacePopup()

    // Disable window caption in overview
    this.#disableWindowCaption()

    // Start on desktop (not overview)
    this.#startOnDesktop()

    Logger.log('Shell tweaks enabled')
  }

  disable () {
    // Restore workspace popup
    this.#enableWorkspacePopup()

    // Restore window caption
    this.#enableWindowCaption()

    // Restore startup behavior
    this.#restoreStartupBehavior()

    Logger.log('Shell tweaks disabled')
    super.disable()
  }

  /**
  * Disable workspace switcher popup (toast in center)
  */
  #disableWorkspacePopup () {
    if (!this.#originals['workspaceSwitcherPopupDisplay']) {
      this.#originals['workspaceSwitcherPopupDisplay']
      = WorkspaceSwitcherPopup.WorkspaceSwitcherPopup.prototype.display
    }

    WorkspaceSwitcherPopup.WorkspaceSwitcherPopup.prototype.display = function() {
      this.destroy()
    }

    Logger.debug(this.name, 'Workspace popup disabled')
  }

  /**
  * Enable workspace switcher popup (restore original)
  */
  #enableWorkspacePopup () {
    if (!this.#originals['workspaceSwitcherPopupDisplay']) {
      return
    }

    WorkspaceSwitcherPopup.WorkspaceSwitcherPopup.prototype.display
    = this.#originals['workspaceSwitcherPopupDisplay']

    Logger.debug(this.name, 'Workspace popup enabled')
  }

  /**
  * Disable window preview caption (title on hover in overview)
  */
  #disableWindowCaption () {
    if (!this.#originals['windowPreviewGetCaption']) {
      this.#originals['windowPreviewGetCaption']
      = WindowPreview.WindowPreview.prototype._getCaption
    }

    WindowPreview.WindowPreview.prototype._getCaption = function() {
      return ''
    }

    Logger.debug(this.name, 'Window caption disabled')
  }

  /**
  * Enable window preview caption (restore original)
  */
  #enableWindowCaption () {
    if (!this.#originals['windowPreviewGetCaption']) {
      return
    }

    WindowPreview.WindowPreview.prototype._getCaption
    = this.#originals['windowPreviewGetCaption']

    Logger.debug(this.name, 'Window caption enabled')
  }

  /**
  * Start on desktop instead of overview
  */
  #startOnDesktop () {
    const sessionMode = Main.sessionMode
    const layoutManager = Main.layoutManager

    // Only apply if system is still starting up
    if (!layoutManager._startingUp) {
      return
    }

    // Save original value
    if (this.#originals['sessionModeHasOverview'] === undefined) {
      this.#originals['sessionModeHasOverview'] = sessionMode.hasOverview
    }

    // Disable overview on startup
    sessionMode.hasOverview = false
    layoutManager.startInOverview = false

    // Set controls to hidden state
    const controls = Main.overview._overview.controls
    controls._stateAdjustment.value = ControlsState.HIDDEN

    // Restore hasOverview after startup is complete
    if (!this.#startupCompleteSignal) {
      this.#startupCompleteSignal = layoutManager.connect('startup-complete', () => {
        sessionMode.hasOverview = this.#originals['sessionModeHasOverview']
        Logger.debug(this.name, 'Startup complete, overview restored')
      })
    }

    Logger.debug(this.name, 'Start on desktop enabled')
  }

  /**
  * Restore startup behavior
  */
  #restoreStartupBehavior () {
    if (this.#originals['sessionModeHasOverview'] === undefined) {
      return
    }

    if (this.#startupCompleteSignal) {
      Main.layoutManager.disconnect(this.#startupCompleteSignal)
      this.#startupCompleteSignal = null
    }

    Logger.debug(this.name, 'Startup behavior restored')
  }
}
