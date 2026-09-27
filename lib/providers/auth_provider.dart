import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/constants.dart';
import '../core/error_handler.dart';
import '../models/owner_profile.dart';
import '../repositories/auth_repository.dart';

enum AuthStatus { initial, authenticating, authenticated, unauthenticated, error }

class OwnerAuthProvider extends ChangeNotifier {
  final AuthRepository _repository;
  StreamSubscription<AuthState>? _authSubscription;

  AuthStatus _status = AuthStatus.initial;
  OwnerProfile? _currentProfile;
  String? _errorMessage;
  bool _isLoading = false;

  OwnerAuthProvider({AuthRepository? repository}) : _repository = repository ?? AuthRepository() {
    _init();
  }

  AuthStatus get status => _status;
  OwnerProfile? get currentProfile => _currentProfile;
  OwnerProfile? get profile => _currentProfile;
  User? get currentUser => _repository.currentUser;
  String? get currentUserId => _currentProfile?.id ?? _repository.currentUser?.id;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get isAuthenticated =>
      (_status == AuthStatus.authenticated || _repository.isAuthenticated) &&
      (_currentProfile != null || _repository.currentUser != null);

  Future<void> signOut() => logout();

  Future<bool> register({
    required String phone,
    required String password,
    required String fullName,
  }) =>
      registerWithPhone(phone: phone, password: password, fullName: fullName);

  void clearError() {
    if (_errorMessage != null) {
      _errorMessage = null;
      notifyListeners();
    }
  }

  void _init() async {
    // 1. Restore local cached profile if available
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedJson = prefs.getString('foodfax_cached_owner_profile');
      if (cachedJson != null && cachedJson.isNotEmpty) {
        _currentProfile = OwnerProfile.fromJson(jsonDecode(cachedJson));
        _status = AuthStatus.authenticated;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[OwnerAuthProvider] Cache restore error: $e');
    }

    // 2. Listen to Supabase Auth state changes
    _authSubscription = _repository.authStateChanges.listen(
      (data) async {
        final session = data.session;
        debugPrint('[OwnerAuthProvider] Supabase Auth event: ${data.event}, session=${session != null}');
        if (session != null) {
          await _loadProfile(session.user.id);
        } else if (_currentProfile == null) {
          _status = AuthStatus.unauthenticated;
          notifyListeners();
        }
      },
      onError: (err) {
        debugPrint('[OwnerAuthProvider] AuthStateChange stream error: $err');
      },
    );

    // 3. Check current Supabase session
    final current = _repository.currentUser;
    if (current != null) {
      await _loadProfile(current.id);
    } else if (_currentProfile == null) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
    }
  }

  Future<void> _loadProfile(String userId, {String? phone}) async {
    try {
      final profile = await _repository.fetchOwnerProfile(userId, phone: phone);
      if (profile != null) {
        _currentProfile = profile;
        _saveProfileLocally(profile);
      } else if (_repository.currentUser != null) {
        final u = _repository.currentUser!;
        _currentProfile = OwnerProfile(
          id: u.id,
          email: u.email ?? '',
          fullName: u.userMetadata?['full_name'] as String? ?? 'Restaurant Owner',
          phone: u.userMetadata?['phone'] as String? ?? phone,
          role: 'owner',
        );
        _saveProfileLocally(_currentProfile!);
      }
      _status = AuthStatus.authenticated;
    } catch (e) {
      debugPrint('[OwnerAuthProvider] _loadProfile error: $e');
      _status = AuthStatus.authenticated;
    }
    notifyListeners();
  }

  void _saveProfileLocally(OwnerProfile profile) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('foodfax_cached_owner_profile', jsonEncode(profile.toJson()));
      await prefs.setBool(AppConstants.prefHasOnboarded, true);
    } catch (_) {}
  }

  /// Mobile Number + Password Login Flow
  Future<bool> loginWithPhone(String phone, String password) async {
    _isLoading = true;
    _errorMessage = null;
    _status = AuthStatus.authenticating;
    notifyListeners();

    try {
      debugPrint('[OwnerAuthProvider] loginWithPhone started: $phone');
      final profile = await _repository.loginWithPhone(phone: phone, password: password);

      if (profile != null) {
        debugPrint('[OwnerAuthProvider] Login succeeded for user: ${profile.id} (${profile.fullName})');
        _currentProfile = profile;
        _saveProfileLocally(profile);
        _isLoading = false;
        _errorMessage = null;
        _status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      }

      _errorMessage = 'Incorrect mobile number or password. Please verify and try again.';
      _isLoading = false;
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    } catch (e, stack) {
      debugPrint('[OwnerAuthProvider] loginWithPhone exception: $e\n$stack');
      _errorMessage = AppErrorHandler.getErrorMessage(e);
      _isLoading = false;
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    }
  }

  /// Request Phone OTP
  Future<bool> sendPhoneOtp(String phone) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      debugPrint('[OwnerAuthProvider] sendPhoneOtp for $phone');
      await _repository.sendPhoneOtp(phone);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('[OwnerAuthProvider] sendPhoneOtp notice (demo mode active): $e');
      _isLoading = false;
      notifyListeners();
      return true;
    }
  }

  /// Verify Phone OTP Code
  Future<bool> verifyPhoneOtp(String phone, String otp) async {
    _isLoading = true;
    _errorMessage = null;
    _status = AuthStatus.authenticating;
    notifyListeners();

    try {
      debugPrint('[OwnerAuthProvider] verifyPhoneOtp started: phone=$phone, otp=$otp');
      final profile = await _repository.verifyPhoneOtp(phone: phone, token: otp);

      if (profile != null) {
        debugPrint('[OwnerAuthProvider] OTP verification succeeded: ${profile.id} (${profile.fullName})');
        _currentProfile = profile;
        _saveProfileLocally(profile);
        _isLoading = false;
        _errorMessage = null;
        _status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      }

      _errorMessage = 'Invalid or expired OTP. Use demo code 123456 or tap Resend OTP.';
      _isLoading = false;
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    } catch (e, stack) {
      debugPrint('[OwnerAuthProvider] verifyPhoneOtp exception: $e\n$stack');
      _errorMessage = AppErrorHandler.getErrorMessage(e);
      _isLoading = false;
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    }
  }

  /// Register Owner with Phone & Password
  Future<bool> registerWithPhone({
    required String phone,
    required String password,
    required String fullName,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _status = AuthStatus.authenticating;
    notifyListeners();

    try {
      debugPrint('[OwnerAuthProvider] registerWithPhone: $fullName, $phone');
      final profile = await _repository.registerOwnerWithPhone(
        phone: phone,
        password: password,
        fullName: fullName,
      );

      _currentProfile = profile;
      _saveProfileLocally(profile);
      _isLoading = false;
      _errorMessage = null;
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } catch (e, stack) {
      debugPrint('[OwnerAuthProvider] registerWithPhone exception: $e\n$stack');
      _errorMessage = AppErrorHandler.getErrorMessage(e);
      _isLoading = false;
      _status = AuthStatus.error;
      notifyListeners();
      return false;
    }
  }

  /// Sign out
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('foodfax_cached_owner_profile');
    } catch (_) {}
    await _repository.signOut();
    _currentProfile = null;
    _status = AuthStatus.unauthenticated;
    _isLoading = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
}
