// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw'
import Gtk from 'gi://Gtk'

/**
* Desktop preferences page - Adaptive Panel + Rounded Corners
*/
export class DesktopPrefs {
  static buildPage (settings) {
    const page = new Adw.PreferencesPage({
      title: 'Desktop',
      icon_name: 'video-display-symbolic',
    })

    // === ADAPTIVE PANEL GROUP ===
    const panelGroup = new Adw.PreferencesGroup({
      title: 'Adaptive Panel',
      description: 'Panel appearance based on wallpaper analysis',
    })

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
    })

    const currentMode = settings.get_string('panel-mode')
    const modeMap = {
      'automatic': 0,
      'dark': 1,
      'light': 2,
      'translucent-dark': 3,
      'translucent-light': 4,
    }
    const reverseModeMap = ['automatic', 'dark', 'light', 'translucent-dark', 'translucent-light']

    modeRow.set_selected(modeMap[currentMode] || 0)
    modeRow.connect('notify::selected', (widget) => {
      settings.set_string('panel-mode', reverseModeMap[widget.selected])
    })

    panelGroup.add(modeRow)

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
    })

    luminanceRow.set_value(settings.get_double('luminance-threshold'))
    luminanceRow.connect('notify::value', (widget) => {
      settings.set_double('luminance-threshold', widget.value)
    })

    panelGroup.add(luminanceRow)

    page.add(panelGroup)

    // === NOTIFICATIONS GROUP ===
    const notificationsGroup = new Adw.PreferencesGroup({
      title: 'Notifications',
      description: 'Configure notification behavior',
    })

    // Window demands attention focus
    const focusRow = new Adw.SwitchRow({
      title: 'Focus windows automatically',
      subtitle: 'Focus windows that demand attention instead of showing notification',
    })

    settings.bind(
      'window-demands-attention-focus',
      focusRow,
      'active',
      0 // Gio.SettingsBindFlags.DEFAULT
    )

    notificationsGroup.add(focusRow)

    // Disable dash pin notifications
    const dashPinRow = new Adw.SwitchRow({
      title: 'Hide dash pin notifications',
      subtitle: 'Don\'t show notifications when pinning/unpinning apps to dash',
    })

    settings.bind(
      'disable-dash-pin-notifications',
      dashPinRow,
      'active',
      0 // Gio.SettingsBindFlags.DEFAULT
    )

    notificationsGroup.add(dashPinRow)

    page.add(notificationsGroup)

    return page
  }
}
