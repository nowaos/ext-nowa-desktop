// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import * as WorkspaceSwitcherPopup from 'resource:///org/gnome/shell/ui/workspaceSwitcherPopup.js'
import * as WindowPreview from 'resource:///org/gnome/shell/ui/windowPreview.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import { ControlsState } from 'resource:///org/gnome/shell/ui/overviewControls.js'

import { _BaseModule } from './_BaseModule.js'
import { Logger } from '../services/Logger.js'
import { t } from '../interfaces/translations.js'

/**
* ShellTweaks - Various GNOME Shell UI tweaks
*/
export class ShellTweaks extends _BaseModule {
  #settings
  #originals = {}
  #startupCompleteSignal = null
  #displayWindowDemandsAttentionSignal = null
  #displayWindowMarkedUrgentSignal = null
  #settingsConnections = []

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

    // Window demands attention: focus instead of notification
    if (this.#settings.get_boolean('window-demands-attention-focus')) {
      this.#enableWindowDemandsAttentionFocus()
    }

    // Monitor setting changes
    this.#settingsConnections.push(
      this.#settings.connect('changed::window-demands-attention-focus', () => {
        if (this.#settings.get_boolean('window-demands-attention-focus')) {
          this.#enableWindowDemandsAttentionFocus()
        } else {
          this.#disableWindowDemandsAttentionFocus()
        }
      })
    )

    // Disable dash pin/unpin notifications
    if (this.#settings.get_boolean('disable-dash-pin-notifications')) {
      this.#disableDashPinNotifications()
    }

    this.#settingsConnections.push(
      this.#settings.connect('changed::disable-dash-pin-notifications', () => {
        if (this.#settings.get_boolean('disable-dash-pin-notifications')) {
          this.#disableDashPinNotifications()
        } else {
          this.#enableDashPinNotifications()
        }
      })
    )

    Logger.log('Shell tweaks enabled')
  }

  disable () {
    // Restore workspace popup
    this.#enableWorkspacePopup()

    // Restore window caption
    this.#enableWindowCaption()

    // Restore startup behavior
    this.#restoreStartupBehavior()

    // Restore window demands attention behavior
    this.#disableWindowDemandsAttentionFocus()

    // Restore dash pin notifications
    this.#enableDashPinNotifications()

    // Disconnect settings signals
    this.#settingsConnections.forEach(id => this.#settings.disconnect(id))
    this.#settingsConnections = []

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

  /**
  * Enable focus when window demands attention (instead of showing notification)
  */
  #enableWindowDemandsAttentionFocus () {
    if (this.#displayWindowDemandsAttentionSignal || this.#displayWindowMarkedUrgentSignal) {
      return
    }

    const display = global.display

    const demandFunction = (display, window) => {
      if (!window || window.has_focus() || window.is_skip_taskbar()) {
        return
      }
      Main.activateWindow(window)
    }

    this.#displayWindowDemandsAttentionSignal = display.connect(
      'window-demands-attention',
      demandFunction
    )

    this.#displayWindowMarkedUrgentSignal = display.connect(
      'window-marked-urgent',
      demandFunction
    )

    // Disconnect original signals to prevent notification
    const signalId = this.#getSignalId(display, 'window-demands-attention')
    const signalId2 = this.#getSignalId(display, 'window-marked-urgent')

    if (signalId) {
      display.disconnect(signalId)
      this.#originals['windowDemandsAttentionSignal'] = signalId
    }

    if (signalId2) {
      display.disconnect(signalId2)
      this.#originals['windowMarkedUrgentSignal'] = signalId2
    }

    Logger.debug(this.name, 'Window demands attention focus enabled')
  }

  /**
  * Disable focus when window demands attention (restore notification)
  */
  #disableWindowDemandsAttentionFocus () {
    if (!this.#displayWindowDemandsAttentionSignal && !this.#displayWindowMarkedUrgentSignal) {
      return
    }

    const display = global.display

    if (this.#displayWindowDemandsAttentionSignal) {
      display.disconnect(this.#displayWindowDemandsAttentionSignal)
      this.#displayWindowDemandsAttentionSignal = null
    }

    if (this.#displayWindowMarkedUrgentSignal) {
      display.disconnect(this.#displayWindowMarkedUrgentSignal)
      this.#displayWindowMarkedUrgentSignal = null
    }

    // Restore original window attention handler
    const wah = Main.windowAttentionHandler
    if (wah) {
      wah._windowDemandsAttentionId = display.connect(
        'window-demands-attention',
        wah._onWindowDemandsAttention.bind(wah)
      )

      wah._windowMarkedUrgentId = display.connect(
        'window-marked-urgent',
        wah._onWindowDemandsAttention.bind(wah)
      )
    }

    Logger.debug(this.name, 'Window demands attention focus disabled')
  }

  /**
  * Get signal ID for a given signal name on an object
  */
  #getSignalId (obj, signalName) {
    const signalIds = []
    const maxId = 10000 // Reasonable upper limit

    for (let id = 1; id < maxId; id++) {
      try {
        const handlerMatch = obj.signal_handler_is_connected(id)
        if (handlerMatch) {
          const info = obj.signal_lookup(signalName, obj)
          if (info) {
            signalIds.push(id)
          }
        }
      } catch (e) {
        // Signal doesn't exist
        continue
      }
    }

    // Return the first matching signal (windowAttentionHandler's signal)
    return signalIds.length > 0 ? signalIds[0] : null
  }

  /**
  * Disable dash pin/unpin notifications
  */
  #disableDashPinNotifications () {
    const MessageTray = Main.messageTray.constructor

    if (!MessageTray || !MessageTray.prototype._updateState) {
      Logger.error('MessageTray._updateState not found')
      return
    }

    // Save original method
    if (!this.#originals['messageTrayUpdateState']) {
      this.#originals['messageTrayUpdateState'] = MessageTray.prototype._updateState
    }

    // Override _updateState to filter notifications
    MessageTray.prototype._updateState = function () {
      // Get translated patterns from GNOME Shell
      // These will be in the user's language automatically
      const pinnedPattern = t('%s has been pinned to the dash.')
        .replace('%s', '.*')  // Replace placeholder with regex wildcard
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')  // Escape special regex chars except our .*
        .replace('\\.\\*', '.*')  // Restore our wildcard

      const unpinnedPattern = t('%s has been unpinned from the dash.')
        .replace('%s', '.*')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace('\\.\\*', '.*')

      // Create regex patterns
      const pinnedRegex = new RegExp(pinnedPattern, 'i')
      const unpinnedRegex = new RegExp(unpinnedPattern, 'i')

      // Filter notification queue
      this._notificationQueue = this._notificationQueue.filter((notification) => {
        const title = notification.title || ''

        // Check if title matches pin/unpin pattern (in user's language)
        const isPinNotification = pinnedRegex.test(title) || unpinnedRegex.test(title)

        if (isPinNotification) {
          Logger.debug('ShellTweaks', `Filtered notification: ${title}`)
          notification.destroy(3) // NotificationDestroyedReason.DISMISSED
          return false // Don't show
        }

        return true
      })

      // Call original _updateState
      this.constructor.prototype._updateState.call(this)
    }.bind(Main.messageTray)

    Logger.debug(this.name, 'Dash pin notifications disabled')
  }

  /**
  * Enable dash pin/unpin notifications (restore original)
  */
  #enableDashPinNotifications () {
    const MessageTray = Main.messageTray.constructor

    if (!MessageTray || !this.#originals['messageTrayUpdateState']) {
      return
    }

    // Restore original method
    MessageTray.prototype._updateState = this.#originals['messageTrayUpdateState']

    Logger.debug(this.name, 'Dash pin notifications enabled')
  }
}
