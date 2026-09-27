import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/owner_profile.dart';

class AuthService {
  SupabaseClient get _client => SupabaseService.client;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  User? get currentUser => _client.auth.currentUser;

  bool get isAuthenticated => _client.auth.currentUser != null;

  Future<AuthResponse> registerOwnerWithPhone({
    required String phone,
    required String password,
    required String fullName,
  }) async {
    final formattedPhone = _formatPhone(phone);
    final response = await _client.auth.signUp(
      phone: formattedPhone,
      password: password,
      data: {'full_name': fullName, 'role': 'shop_owner'},
    );
    return response;
  }

  Future<AuthResponse> loginWithPhone({
    required String phone,
    required String password,
  }) async {
    final formattedPhone = _formatPhone(phone);
    final response = await _client.auth.signInWithPassword(
      phone: formattedPhone,
      password: password,
    );
    return response;
  }

  Future<void> sendPhoneOtp(String phone) async {
    final formattedPhone = _formatPhone(phone);
    await _client.auth.signInWithOtp(phone: formattedPhone);
  }

  Future<AuthResponse> verifyPhoneOtp({
    required String phone,
    required String token,
  }) async {
    final formattedPhone = _formatPhone(phone);
    final response = await _client.auth.verifyOTP(
      phone: formattedPhone,
      token: token,
      type: OtpType.sms,
    );
    return response;
  }

  Future<void> signOut() async {
    try {
      await _client.auth.signOut();
    } catch (e) {
      debugPrint('Sign out error: $e');
    }
  }

  Future<OwnerProfile?> fetchOwnerProfile(String userId) async {
    try {
      final data = await _client
          .from('owner_profiles')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (data == null) {
        // Fallback to auth metadata
        final user = _client.auth.currentUser;
        if (user != null) {
          return OwnerProfile(
            id: user.id,
            email: user.email ?? (user.phone != null ? '${user.phone}@foodfax.in' : ''),
            fullName: user.userMetadata?['full_name'] as String? ?? 'Shop Owner',
            phone: user.phone ?? '',
            createdAt: DateTime.tryParse(user.createdAt) ?? DateTime.now(),
          );
        }
        return null;
      }
      return OwnerProfile.fromJson(data);
    } catch (e) {
      debugPrint('fetchOwnerProfile error: $e');
      return null;
    }
  }

  Future<void> refreshSession() async {
    try {
      await _client.auth.refreshSession();
    } catch (e) {
      debugPrint('refreshSession warning: $e');
    }
  }

  String _formatPhone(String rawPhone) {
    var cleaned = rawPhone.replaceAll(RegExp(r'\s+'), '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.length == 10) {
        cleaned = '+91$cleaned';
      } else {
        cleaned = '+$cleaned';
      }
    }
    return cleaned;
  }
}
