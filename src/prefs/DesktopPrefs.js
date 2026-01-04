// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw'

/**
* Desktop preferences page - Notifications
*/
export class DesktopPrefs {
  static buildPage (settings) {
    const page = new Adw.PreferencesPage({
      title: 'Desktop',
      icon_name: 'video-display-symbolic',
    })

    // === DASH TO DOCK GROUP ===
    const dashToDockGroup = new Adw.PreferencesGroup({
      title: 'Dash to Dock',
      description: 'Simplified appearance for Dash to Dock extension',
    })

    const dashTweaksRow = new Adw.SwitchRow({
      title: 'Simplify Dash to Dock',
      subtitle: 'Cleaner design: translucent background, no hover effects',
    })

    settings.bind(
      'enable-dash-to-dock-tweaks',
      dashTweaksRow,
      'active',
      0 // Gio.SettingsBindFlags.DEFAULT
    )

    dashToDockGroup.add(dashTweaksRow)

    page.add(dashToDockGroup)

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
