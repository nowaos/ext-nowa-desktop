import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class NowaDesktopPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    // Main page
    const page = new Adw.PreferencesPage({
      title: 'Settings',
      icon_name: 'preferences-system-symbolic',
    });

    // === TOP BAR GROUP ===
    const topBarGroup = new Adw.PreferencesGroup({
      title: 'Top Bar',
      description: 'Panel appearance settings',
    });

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
    });

    // Map current value to index
    const currentMode = settings.get_string('panel-mode');
    const modeMap = {
      'automatic': 0,
      'dark': 1,
      'light': 2,
      'translucent-dark': 3,
      'translucent-light': 4,
    };
    const reverseModeMap = ['automatic', 'dark', 'light', 'translucent-dark', 'translucent-light'];
    
    modeRow.set_selected(modeMap[currentMode] || 0);

    modeRow.connect('notify::selected', (widget) => {
      const selected = widget.get_selected();
      settings.set_string('panel-mode', reverseModeMap[selected]);
    });

    topBarGroup.add(modeRow);

    // Luminance threshold with debounce
    const luminanceRow = new Adw.ActionRow({
      title: 'Luminance Threshold',
      subtitle: 'Threshold for dark/light detection',
    });

    const luminanceScale = new Gtk.Scale({
      orientation: Gtk.Orientation.HORIZONTAL,
      adjustment: new Gtk.Adjustment({
        lower: 0.0,
        upper: 1.0,
        step_increment: 0.01,
        value: settings.get_double('luminance-threshold'),
      }),
      draw_value: true,
      value_pos: Gtk.PositionType.RIGHT,
      digits: 2,
      hexpand: true,
      valign: Gtk.Align.CENTER,
    });

    let luminanceTimeout = null;
    luminanceScale.connect('value-changed', (widget) => {
      if (luminanceTimeout) {
        GLib.Source.remove(luminanceTimeout);
      }
      luminanceTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
        settings.set_double('luminance-threshold', widget.get_value());
        luminanceTimeout = null;
        return GLib.SOURCE_REMOVE;
      });
    });

    luminanceRow.add_suffix(luminanceScale);
    luminanceRow.activatable_widget = luminanceScale;
    topBarGroup.add(luminanceRow);

    page.add(topBarGroup);

    // === MONITOR CORNERS GROUP ===
    const cornersGroup = new Adw.PreferencesGroup({
      title: 'Monitor Corners',
      description: 'Rounded corners for screen edges',
    });
    
    // Corner radius slider
    const radiusRow = new Adw.ActionRow({
      title: 'Radius',
      subtitle: 'Corner size in pixels (0 = disabled)',
    });

    const radiusScale = new Gtk.Scale({
      orientation: Gtk.Orientation.HORIZONTAL,
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 32,
        step_increment: 1,
        value: settings.get_int('corner-radius'),
      }),
      draw_value: true,
      value_pos: Gtk.PositionType.RIGHT,
      digits: 0,
      hexpand: true,
      valign: Gtk.Align.CENTER,
    });

    radiusScale.connect('value-changed', (widget) => {
      settings.set_int('corner-radius', Math.round(widget.get_value()));
    });

    radiusRow.add_suffix(radiusScale);
    radiusRow.activatable_widget = radiusScale;
    cornersGroup.add(radiusRow);
    
    page.add(cornersGroup);

    // === THEME GROUP ===
    const themeGroup = new Adw.PreferencesGroup({
      title: 'Theme',
      description: 'Automatic light/dark theme switching',
    });

    // Enable auto theme toggle
    const enableThemeRow = new Adw.SwitchRow({
      title: 'Enable Auto Theme',
      subtitle: 'Switch theme based on sunrise/sunset times',
    });

    settings.bind(
      'enable-auto-theme',
      enableThemeRow,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );

    themeGroup.add(enableThemeRow);

    // Sunrise time
    const sunriseRow = new Adw.EntryRow({
      title: 'Sunrise Time',
      show_apply_button: true,
    });

    sunriseRow.set_text(settings.get_string('sunrise-time'));

    sunriseRow.connect('apply', (widget) => {
      const time = widget.get_text();
      // Validate HH:MM format
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        settings.set_string('sunrise-time', time);
      } else {
        widget.set_text(settings.get_string('sunrise-time'));
      }
    });

    themeGroup.add(sunriseRow);

    // Sunset time
    const sunsetRow = new Adw.EntryRow({
      title: 'Sunset Time',
      show_apply_button: true,
    });

    sunsetRow.set_text(settings.get_string('sunset-time'));

    sunsetRow.connect('apply', (widget) => {
      const time = widget.get_text();
      // Validate HH:MM format
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
        settings.set_string('sunset-time', time);
      } else {
        widget.set_text(settings.get_string('sunset-time'));
      }
    });

    themeGroup.add(sunsetRow);
    
    const timeLabel = new Gtk.Label({
      label: 'Format: HH:MM (24-hour)',
      css_classes: ['dim-label', 'caption'],
      xalign: 0,
      margin_start: 12,
      margin_end: 12,
      margin_bottom: 12,
    });
    themeGroup.add(timeLabel);
    
    page.add(themeGroup);

    // === LIVE WALLPAPER GROUP ===
    const wallpaperGroup = new Adw.PreferencesGroup({
      title: 'Live Wallpaper',
      description: 'Daily wallpaper from Unsplash',
    });

    // Enable toggle
    const enableWallpaperRow = new Adw.SwitchRow({
      title: 'Enable Live Wallpaper',
      subtitle: 'Automatically change wallpaper daily',
    });

    settings.bind(
      'enable-live-wallpaper',
      enableWallpaperRow,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    );

    wallpaperGroup.add(enableWallpaperRow);

    // API Key
    const apiKeyRow = new Adw.EntryRow({
      title: 'Unsplash API Key',
      show_apply_button: true,
    });

    apiKeyRow.set_text(settings.get_string('unsplash-api-key'));

    apiKeyRow.connect('apply', (widget) => {
      settings.set_string('unsplash-api-key', widget.get_text());
    });

    wallpaperGroup.add(apiKeyRow);

    // Keywords
    const keywordsRow = new Adw.EntryRow({
      title: 'Keywords',
      show_apply_button: true,
    });

    keywordsRow.set_text(settings.get_string('wallpaper-keywords'));

    keywordsRow.connect('apply', (widget) => {
      settings.set_string('wallpaper-keywords', widget.get_text());
    });

    wallpaperGroup.add(keywordsRow);
    
    const keywordsLabel = new Gtk.Label({
      label: 'Comma-separated (e.g., nature, mountains, sunset)',
      css_classes: ['dim-label', 'caption'],
      xalign: 0,
      margin_start: 12,
      margin_end: 12,
      margin_bottom: 12,
    });
    wallpaperGroup.add(keywordsLabel);

    // Refresh button
    const refreshRow = new Adw.ActionRow({
      title: 'Refresh Wallpaper',
      subtitle: 'Download and apply a new wallpaper now',
    });

    const refreshButton = new Gtk.Button({
      label: 'Refresh',
      valign: Gtk.Align.CENTER,
    });

    refreshButton.connect('clicked', () => {
      console.log('Nowa Desktop: Refresh button clicked in prefs');
      settings.set_string('last-wallpaper-change', 'force-refresh-' + Date.now());
    });

    refreshRow.add_suffix(refreshButton);
    refreshRow.activatable_widget = refreshButton;
    wallpaperGroup.add(refreshRow);
    
    page.add(wallpaperGroup);

    // === RESET GROUP ===
    const resetGroup = new Adw.PreferencesGroup({
      title: 'Reset',
      description: 'Restore default settings',
    });

    // Reset button
    const resetRow = new Adw.ActionRow({
      title: 'Reset to Defaults',
      subtitle: 'Restore all settings to factory defaults',
    });

    const resetButton = new Gtk.Button({
      label: 'Reset',
      valign: Gtk.Align.CENTER,
      css_classes: ['destructive-action'],
    });

    resetButton.connect('clicked', () => {
      this._showResetDialog(window, settings, modeRow, luminanceScale, radiusScale);
    });

    resetRow.add_suffix(resetButton);
    resetRow.activatable_widget = resetButton;
    resetGroup.add(resetRow);

    page.add(resetGroup);

    window.add(page);
  }

  _showResetDialog(window, settings, modeRow, luminanceScale, radiusScale) {
    const dialog = new Adw.MessageDialog({
      transient_for: window,
      modal: true,
      heading: 'Reset Settings?',
      body: 'This will restore all settings to their default values.',
    });

    dialog.add_response('cancel', 'Cancel');
    dialog.add_response('reset', 'Reset');
    dialog.set_response_appearance('reset', Adw.ResponseAppearance.DESTRUCTIVE);

    dialog.connect('response', (dialog, response) => {
      if (response === 'reset') {
        // Reset settings to defaults
        settings.reset('panel-mode');
        settings.reset('luminance-threshold');
        settings.reset('corner-radius');
        settings.reset('enable-auto-theme');
        settings.reset('sunrise-time');
        settings.reset('sunset-time');
        
        // Update UI widgets
        modeRow.set_selected(0); // automatic
        luminanceScale.set_value(0.575);
        radiusScale.set_value(6);
        
        console.log('Nowa Desktop: Settings reset to defaults');
      }
      dialog.close();
    });

    dialog.present();
  }
}
