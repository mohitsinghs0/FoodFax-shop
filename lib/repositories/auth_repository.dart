import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/owner_profile.dart';
import '../services/auth_service.dart';

class AuthRepository {
  final AuthService _authService;

  AuthRepository({AuthService? authService}) : _authService = authService ?? AuthService();

  Stream<AuthState> get authStateChanges => _authService.authStateChanges;
  User? get currentUser => _authService.currentUser;
  bool get isAuthenticated => _authService.isAuthenticated;

  Future<OwnerProfile> registerOwnerWithPhone({
    required String phone,
    required String password,
    required String fullName,
  }) {
    return _authService.registerOwnerWithPhone(
      phone: phone,
      password: password,
      fullName: fullName,
    );
  }

  Future<OwnerProfile?> loginWithPhone({
    required String phone,
    required String password,
  }) {
    return _authService.loginWithPhone(phone: phone, password: password);
  }

  Future<void> sendPhoneOtp(String phone) => _authService.sendPhoneOtp(phone);

  Future<OwnerProfile?> verifyPhoneOtp({
    required String phone,
    required String token,
  }) =>
      _authService.verifyPhoneOtp(phone: phone, token: token);

  Future<void> signOut() => _authService.signOut();

  Future<OwnerProfile?> fetchOwnerProfile(String userId, {String? phone}) =>
      _authService.fetchOwnerProfile(userId, phone: phone);

  Future<void> refreshToken() => _authService.refreshSession();
}
