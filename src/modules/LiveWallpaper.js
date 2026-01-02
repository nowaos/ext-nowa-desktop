// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio'
import GLib from 'gi://GLib'

import { _BaseModule } from './_BaseModule.js'
import { Logger } from '../services/Logger.js'
import { UnsplashAPI } from '../services/UnsplashAPI.js'

const BACKGROUND_KEY = 'picture-uri'
const BACKGROUND_KEY_DARK = 'picture-uri-dark'

/**
* LiveWallpaper module - downloads daily wallpapers from Unsplash
*/
export class LiveWallpaper extends _BaseModule {
  #settings
  #backgroundSettings
  #wallpaperCheckTimer = null
  #settingsConnections = []

  constructor (settings) {
    super()

    this.#settings = settings
    this.#backgroundSettings = new Gio.Settings({
      schema_id: 'org.gnome.desktop.background'
    })
  }

  enable () {
    super.enable()

    const enabled = this.#settings.get_boolean('enable-live-wallpaper')

    if (!enabled) {
      Logger.debug(this.name, 'Live wallpaper is disabled')
      return
    }

    // Check on enable
    this.#checkAndUpdate()

    // Setup 6 AM timer (check every hour)
    this.#wallpaperCheckTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3600, () => {
      const now = new Date()
      if (now.getHours() === 6) {
        this.#checkAndUpdate()
      }
      return GLib.SOURCE_CONTINUE
    })

    // Listen for force refresh
    this.#settingsConnections.push(
      this.#settings.connect('changed::last-wallpaper-change', () => {
        const value = this.#settings.get_string('last-wallpaper-change')
        if (value.startsWith('force-refresh-')) {
          Logger.debug(this.name, 'Force refresh triggered')
          this.#update()
        }
      })
    )

    Logger.debug(this.name, 'Setup complete')
  }

  disable () {
    super.disable()

    if (this.#wallpaperCheckTimer) {
      GLib.Source.remove(this.#wallpaperCheckTimer)
      this.#wallpaperCheckTimer = null
    }

    this.#settingsConnections.forEach(id => this.#settings.disconnect(id))
    this.#settingsConnections = []
  }

  #checkAndUpdate () {
    const today = new Date().toISOString().split('T')[0]
    const lastChange = this.#settings.get_string('last-wallpaper-change')

    if (lastChange !== today) {
      Logger.debug(this.name, `Needs update (last: ${lastChange}, today: ${today})`)
      this.#update()
    }
  }

  async #update () {
    const apiKey = this.#settings.get_string('unsplash-api-key')

    if (!apiKey || apiKey === '') {
      Logger.debug(this.name, 'No Unsplash API key configured')
      return
    }

    try {
      // Use UnsplashAPI service (SRP + DIP: Dependency Inversion Principle)
      const unsplash = new UnsplashAPI(apiKey)

      const keywords = this.#settings.get_string('wallpaper-keywords')
      const photo = await unsplash.getRandomPhoto({
        orientation: 'landscape',
        query: keywords
      })

      Logger.debug(this.name, `Downloading wallpaper: ${photo.id}`)

      const imageBytes = await unsplash.downloadImage(photo.urls.raw, 3840, 85)

      // Save to cache
      const cacheDir = GLib.build_filenamev([GLib.get_user_cache_dir(), 'nowa-desktop'])
      GLib.mkdir_with_parents(cacheDir, 0o755)

      const filename = `wallpaper-${photo.id}.jpg`
      const filepath = GLib.build_filenamev([cacheDir, filename])

      const file = Gio.File.new_for_path(filepath)
      file.replace_contents(
        imageBytes,
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null
      )

      // Set as wallpaper
      const fileUri = `file://${filepath}`
      this.#backgroundSettings.set_string(BACKGROUND_KEY, fileUri)
      this.#backgroundSettings.set_string(BACKGROUND_KEY_DARK, fileUri)

      // Update last change date
      const today = new Date().toISOString().split('T')[0]
      this.#settings.set_string('last-wallpaper-change', today)

      Logger.log(`Wallpaper updated successfully (${photo.id})`)

    } catch (error) {
      Logger.error(`Failed to update wallpaper: ${error.message}`)
    }
  }
}
