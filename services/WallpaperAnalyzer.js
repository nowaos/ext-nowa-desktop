// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

import GdkPixbuf from 'gi://GdkPixbuf';

import { Logger } from '../utils/Logger.js';

/**
 * WallpaperAnalyzer - Single Responsibility: Analyze wallpaper colors and luminance
 *
 * Responsibilities:
 * - Load wallpaper image
 * - Extract color information
 * - Calculate luminance
 * - Determine if background is dark or light
 */
export class WallpaperAnalyzer {
  /**
   * Analyzes a wallpaper and determines if it's dark or light
   * @param {string} wallpaperPath - Path to wallpaper file
   * @param {number} luminanceThreshold - Threshold for dark/light detection (0.0-1.0)
   * @returns {object} Analysis result: { isDark: boolean, luminance: number }
   */
  static analyze(wallpaperPath, luminanceThreshold = 0.575) {
    try {
      // Load wallpaper at reduced size for performance
      const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(
        wallpaperPath,
        100,
        -1,
        true
      );

      const luminance = this.#calculateLuminance(pixbuf);
      const isDark = luminance < luminanceThreshold;

      Logger.debug('WallpaperAnalyzer', `Luminance: ${luminance.toFixed(3)}, Threshold: ${luminanceThreshold}, Dark: ${isDark}`);

      return {
        isDark,
        luminance,
        threshold: luminanceThreshold
      };

    } catch (error) {
      Logger.error(`WallpaperAnalyzer: Failed to analyze wallpaper - ${error.message}`);
      // Default to light background on error
      return {
        isDark: false,
        luminance: 0.5,
        threshold: luminanceThreshold,
        error: error.message
      };
    }
  }

  /**
   * Calculates average luminance of top portion of image
   * @param {GdkPixbuf.Pixbuf} pixbuf - Image pixbuf
   * @returns {number} Average luminance (0.0-1.0)
   * @private
   */
  static #calculateLuminance(pixbuf) {
    const pixels = pixbuf.get_pixels();
    const rowstride = pixbuf.get_rowstride();
    const height = pixbuf.get_height();
    const width = pixbuf.get_width();
    const nChannels = pixbuf.get_n_channels();

    let totalLuminance = 0;
    let sampleCount = 0;

    // Sample top 30% of image (where panel will be)
    const sampleHeight = Math.min(30, Math.floor(height * 0.3));

    for (let y = 0; y < sampleHeight; y++) {
      for (let x = 0; x < width; x++) {
        const offset = y * rowstride + x * nChannels;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];

        // Calculate relative luminance (ITU-R BT.709)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        totalLuminance += luminance;
        sampleCount++;
      }
    }

    return totalLuminance / sampleCount;
  }

  /**
   * Extracts dominant colors from wallpaper
   * @param {string} wallpaperPath - Path to wallpaper file
   * @param {number} numColors - Number of dominant colors to extract
   * @returns {Array} Array of RGB color objects
   */
  static extractDominantColors(wallpaperPath, numColors = 5) {
    // Future enhancement: K-means clustering for color extraction
    // Currently not used but ready for future features
    Logger.debug('WallpaperAnalyzer', 'Color extraction not yet implemented');
    return [];
  }
}
