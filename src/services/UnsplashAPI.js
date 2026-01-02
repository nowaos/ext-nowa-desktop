// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib'

import { Logger } from './Logger.js'

/**
 * UnsplashAPI - Single Responsibility: Communicate with Unsplash API
 *
 * Responsibilities:
 * - Make API requests to Unsplash
 * - Handle authentication
 * - Parse responses
 * - Download images
 *
 * Open/Closed Principle: Easy to extend with new API methods
 * Dependency Inversion: Other services depend on this abstraction
 */
export class UnsplashAPI {
  #apiKey
  #baseUrl = 'https://api.unsplash.com'

  /**
   * @param {string} apiKey - Unsplash API access key
   */
  constructor (apiKey) {
    this.#apiKey = apiKey
  }

  /**
   * Fetches a random photo from Unsplash
   * @param {object} options - Query options
   * @param {string} options.orientation - Photo orientation (landscape, portrait, squarish)
   * @param {string} options.query - Search keywords (comma-separated)
   * @returns {Promise<object>} Photo metadata
   */
  async getRandomPhoto (options = {}) {
    const {
      orientation = 'landscape',
      query = ''
    } = options

    let url = `${this.#baseUrl}/photos/random?orientation=${orientation}`

    if (query) {
      const keywords = query.split(',').map(k => k.trim()).filter(k => k).join(',')
      url += `&query=${encodeURIComponent(keywords)}`
    }

    Logger.debug('UnsplashAPI', `Fetching random photo (keywords: ${query || 'none'})`)

    try {
      const response = await this.#makeRequest(url)

      return {
        id: response.id,
        width: response.width,
        height: response.height,
        description: response.description || response.alt_description,
        urls: response.urls,
        author: {
          name: response.user?.name,
          username: response.user?.username
        }
      }

    } catch (error) {
      Logger.error(`UnsplashAPI: Failed to fetch photo - ${error.message}`)
      throw error
    }
  }

  /**
   * Downloads an image from URL
   * @param {string} url - Image URL
   * @param {number} width - Desired width (for optimization)
   * @param {number} quality - JPEG quality (1-100)
   * @returns {Promise<Uint8Array>} Image bytes
   */
  async downloadImage (url, width = 3840, quality = 85) {
    // Optimize URL with width and quality parameters
    const optimizedUrl = `${url}&w=${width}&q=${quality}`

    Logger.debug('UnsplashAPI', `Downloading image (${width}px, q${quality})`)

    try {
      const Soup = imports.gi.Soup
      const session = new Soup.Session()
      const message = Soup.Message.new('GET', optimizedUrl)

      const bytes = await new Promise((resolve, reject) => {
        session.send_and_read_async(
          message,
          GLib.PRIORITY_DEFAULT,
          null,
          (sess, result) => {
            try {
              const b = sess.send_and_read_finish(result)
              resolve(b)
            } catch (e) {
              reject(e)
            }
          }
        )
      })

      if (message.status_code !== 200) {
        throw new Error(`HTTP ${message.status_code}`)
      }

      return bytes.get_data()

    } catch (error) {
      Logger.error(`UnsplashAPI: Failed to download image - ${error.message}`)
      throw error
    }
  }

  /**
   * Makes an authenticated request to Unsplash API
   * @param {string} url - API endpoint URL
   * @returns {Promise<object>} Parsed JSON response
   * @private
   */
  async #makeRequest (url) {
    const Soup = imports.gi.Soup
    const session = new Soup.Session()
    const message = Soup.Message.new('GET', url)

    // Add authentication header
    message.request_headers.append('Authorization', `Client-ID ${this.#apiKey}`)

    const bytes = await new Promise((resolve, reject) => {
      session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null,
        (sess, result) => {
          try {
            const b = sess.send_and_read_finish(result)
            resolve(b)
          } catch (e) {
            reject(e)
          }
        }
      )
    })

    if (message.status_code !== 200) {
      throw new Error(`HTTP ${message.status_code}`)
    }

    const decoder = new TextDecoder('utf-8')
    return JSON.parse(decoder.decode(bytes))
  }

  /**
   * Validates if API key is set
   * @returns {boolean}
   */
  isConfigured () {
    return this.#apiKey && this.#apiKey !== ''
  }
}
