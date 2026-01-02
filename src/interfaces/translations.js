// SPDX-FileCopyrightText: Nowa Desktop Contributors
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Translations interface - Wrapper for GNOME Shell gettext
 *
 * Encapsulates translation dependencies to isolate version-specific code.
 * If GNOME changes translation APIs in future versions, only this file needs updating.
 */

let translationFunction = null

/**
 * Initialize translation function
 * Tries multiple methods to get GNOME Shell translations
 */
function initTranslations () {
  if (translationFunction) {
    return
  }

  try {
    // Method 1: Try using Gettext module (GNOME 45+)
    const Gettext = imports.gi?.Gettext
    if (Gettext) {
      const Domain = Gettext.domain('gnome-shell')
      translationFunction = Domain.gettext
      return
    }
  } catch (e) {
    // Gettext not available, try next method
  }

  try {
    // Method 2: Try using Shell's built-in gettext (GNOME 40-44)
    const Gettext = imports.gettext
    if (Gettext) {
      Gettext.textdomain('gnome-shell')
      translationFunction = Gettext.gettext
      return
    }
  } catch (e) {
    // Built-in gettext not available
  }

  // Fallback: Return original string (no translation)
  translationFunction = (text) => text
  console.warn('Nowa Desktop: Translation system not available, using fallback')
}

/**
 * Translate a string using GNOME Shell's translation domain
 *
 * @param {string} text - Text to translate (should match GNOME Shell's translation keys)
 * @returns {string} Translated text in user's language
 *
 * @example
 * const pinText = t('%s has been pinned to the dash.')
 * // Returns: "Files foi fixado no painel." (in PT-BR)
 */
export function t (text) {
  if (!translationFunction) {
    initTranslations()
  }

  return translationFunction(text)
}

/**
 * Alias for t() - common convention in i18n libraries
 */
export const _ = t
