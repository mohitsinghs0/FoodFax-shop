import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AppErrorHandler {
  /// Converts any exception, error, or string into an intuitive, user-friendly message
  static String getErrorMessage(dynamic error) {
    if (error == null) {
      return 'Unable to sign in. Please verify your mobile number and password.';
    }

    // Log the raw error in debug mode for developer audits
    debugPrint('[AppErrorHandler] Parsing error: $error (${error.runtimeType})');

    String raw = '';
    if (error is AuthException) {
      raw = error.message;
    } else if (error is PostgrestException) {
      raw = error.message;
    } else if (error is StorageException) {
      raw = error.message;
    } else if (error is SocketException) {
      return 'No internet connection. Please check your Wi-Fi or mobile data.';
    } else if (error is TimeoutException) {
      return 'Server response timed out. Please check your internet connection and try again.';
    } else if (error is String) {
      raw = error;
    } else {
      raw = error.toString();
    }

    final lower = raw.toLowerCase();

    // Specific Supabase Auth & PostgreSQL error pattern matchers
    if (lower.contains('invalid login credentials') ||
        lower.contains('invalid grant') ||
        lower.contains('invalid_grant')) {
      return 'Incorrect mobile number or password. Please verify and try again.';
    }

    if (lower.contains('user not found') || lower.contains('no user found')) {
      return 'Mobile number is not registered. Please tap "Register Restaurant" below.';
    }

    if (lower.contains('already registered') || lower.contains('user already exists')) {
      return 'An account with this mobile number already exists. Please sign in with your password.';
    }

    if (lower.contains('otp') &&
        (lower.contains('expired') || lower.contains('invalid') || lower.contains('token') || lower.contains('wrong'))) {
      return 'Invalid or expired OTP code. Use test code 123456 or tap Resend OTP.';
    }

    if (lower.contains('phone provider is not enabled') ||
        lower.contains('unsupported phone provider') ||
        lower.contains('sms provider not configured')) {
      return 'Phone SMS gateway is currently in demo mode. Please enter OTP code 123456 or use password.';
    }

    if (lower.contains('rate limit') || lower.contains('too many requests') || lower.contains('over_email_send_rate_limit')) {
      return 'Too many attempts. Please wait 30 seconds before trying again.';
    }

    if (lower.contains('network') ||
        lower.contains('failed host lookup') ||
        lower.contains('clientexception') ||
        lower.contains('connection refused') ||
        lower.contains('socketexception')) {
      return 'Unable to reach the server. Please check your internet connection.';
    }

    if (lower.contains('weak_password') || lower.contains('password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }

    // Strip internal Dart Exception prefixes if present
    final clean = raw
        .replaceAll('AuthException:', '')
        .replaceAll('PostgrestException:', '')
        .replaceAll('Exception:', '')
        .replaceAll(RegExp(r'\{.*\}'), '')
        .trim();

    if (clean.isNotEmpty && clean.length <= 140 && !clean.contains('flutter/') && !clean.contains('package:')) {
      return clean;
    }

    return 'Unable to sign in. Please check your mobile number or tap Register Restaurant.';
  }

  static void showErrorSnackBar(BuildContext context, dynamic error) {
    final message = getErrorMessage(error);
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  static void showSuccessSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.green.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
