import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';

class AudioService {
  static final AudioService _instance = AudioService._internal();
  factory AudioService() => _instance;
  AudioService._internal();

  AudioPlayer? _player;
  bool _isInitialized = false;

  Future<void> init() async {
    if (_isInitialized) return;
    try {
      _player = AudioPlayer();
      await _player?.setReleaseMode(ReleaseMode.stop);
      _isInitialized = true;
    } catch (e) {
      debugPrint('AudioService init warning: $e');
    }
  }

  Future<void> playNewOrderAlert() async {
    try {
      if (_player == null) await init();
      // Play sound from assets
      await _player?.stop();
      await _player?.play(AssetSource('sounds/new_order_chime.mp3'), volume: 1.0);
    } catch (e) {
      debugPrint('AudioService play error: $e');
    }
  }

  Future<void> stopAlert() async {
    try {
      await _player?.stop();
    } catch (e) {
      debugPrint('AudioService stop error: $e');
    }
  }

  void dispose() {
    _player?.dispose();
    _player = null;
    _isInitialized = false;
  }
}
