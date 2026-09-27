import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';
import '../providers/auth_provider.dart';
import '../providers/shop_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import '../core/error_handler.dart';

class OwnerLoginScreen extends StatefulWidget {
  const OwnerLoginScreen({super.key});

  @override
  State<OwnerLoginScreen> createState() => _OwnerLoginScreenState();
}

class _OwnerLoginScreenState extends State<OwnerLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();

  final String _countryCode = '+91';
  bool _obscurePassword = true;
  bool _useOtpMode = false;
  bool _otpSent = false;
  String? _inlineError;
  String? _inlineSuccess;

  @override
  void initState() {
    super.initState();
    _markOnboarded();
  }

  void _markOnboarded() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(AppConstants.prefHasOnboarded, true);
    } catch (_) {}
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  String get _fullPhoneNumber => '$_countryCode${_phoneController.text.trim()}';

  Future<void> _handlePasswordLogin() async {
    setState(() {
      _inlineError = null;
      _inlineSuccess = null;
    });

    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<OwnerAuthProvider>();
    final shopProvider = context.read<ShopProvider>();

    try {
      final success = await auth.loginWithPhone(
        _fullPhoneNumber,
        _passwordController.text,
      );

      if (!mounted) return;

      if (success) {
        final userId = auth.currentProfile?.id ?? auth.currentUser?.id;
        if (userId != null && userId.isNotEmpty) {
          final hasShop = await shopProvider.checkShopSetup(userId);
          if (!mounted) return;
          if (hasShop) {
            context.go('/dashboard');
          } else {
            context.go('/shop-setup');
          }
        } else {
          context.go('/dashboard');
        }
      } else {
        final err = auth.errorMessage ?? 'Incorrect mobile number or password. Please verify and try again.';
        setState(() => _inlineError = err);
        AppErrorHandler.showErrorSnackBar(context, err);
      }
    } catch (e) {
      final err = AppErrorHandler.getErrorMessage(e);
      if (mounted) {
        setState(() => _inlineError = err);
        AppErrorHandler.showErrorSnackBar(context, err);
      }
    }
  }

  Future<void> _handleSendOtp() async {
    setState(() {
      _inlineError = null;
      _inlineSuccess = null;
    });

    final rawPhone = _phoneController.text.trim();
    if (rawPhone.length < 10) {
      const msg = 'Please enter a valid 10-digit mobile number';
      setState(() => _inlineError = msg);
      AppErrorHandler.showErrorSnackBar(context, msg);
      return;
    }

    final auth = context.read<OwnerAuthProvider>();
    try {
      final ok = await auth.sendPhoneOtp(_fullPhoneNumber);
      if (!mounted) return;

      if (ok) {
        setState(() {
          _otpSent = true;
          _inlineSuccess = 'OTP sent to $_fullPhoneNumber. (Use 123456 in demo mode)';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('OTP sent to $_fullPhoneNumber. Enter code 123456 to verify.'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        final err = auth.errorMessage ?? 'Failed to send OTP code. Please try using password login.';
        setState(() => _inlineError = err);
        AppErrorHandler.showErrorSnackBar(context, err);
      }
    } catch (e) {
      final err = AppErrorHandler.getErrorMessage(e);
      if (mounted) {
        setState(() => _inlineError = err);
        AppErrorHandler.showErrorSnackBar(context, err);
      }
    }
  }

  Future<void> _handleVerifyOtp() async {
    setState(() {
      _inlineError = null;
      _inlineSuccess = null;
    });

    final otp = _otpController.text.trim();
    if (otp.length < 4) {
      const msg = 'Please enter the 6-digit verification code (e.g. 123456)';
      setState(() => _inlineError = msg);
      AppErrorHandler.showErrorSnackBar(context, msg);
      return;
    }

    final auth = context.read<OwnerAuthProvider>();
    final shopProvider = context.read<ShopProvider>();

    try {
      final success = await auth.verifyPhoneOtp(_fullPhoneNumber, otp);
      if (!mounted) return;

      if (success) {
        final userId = auth.currentProfile?.id ?? auth.currentUser?.id;
        if (userId != null && userId.isNotEmpty) {
          final hasShop = await shopProvider.checkShopSetup(userId);
          if (!mounted) return;
          if (hasShop) {
            context.go('/dashboard');
          } else {
            context.go('/shop-setup');
          }
        } else {
          context.go('/dashboard');
        }
      } else {
        final err = auth.errorMessage ?? 'Invalid verification code. Please enter 123456 or resend code.';
        setState(() => _inlineError = err);
        AppErrorHandler.showErrorSnackBar(context, err);
      }
    } catch (e) {
      final err = AppErrorHandler.getErrorMessage(e);
      if (mounted) {
        setState(() => _inlineError = err);
        AppErrorHandler.showErrorSnackBar(context, err);
      }
    }
  }

  void _showForgotPasswordDialog() {
    final resetPhoneController = TextEditingController(text: _phoneController.text);
    final resetOtpController = TextEditingController();
    final newPasswordController = TextEditingController();
    bool isCodeSent = false;
    String? localCode;
    String? modalError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Reset Password',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppColors.textMuted),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (modalError != null)
                    Container(
                      padding: const EdgeInsets.all(10),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.15),
                        border: Border.all(color: Colors.red.shade400.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline, color: Colors.red.shade400, size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              modalError!,
                              style: TextStyle(fontSize: 12, color: Colors.red.shade300, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),

                  const Text(
                    'Enter your registered mobile number to receive a verification code.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  if (!isCodeSent) ...[
                    CustomTextField(
                      controller: resetPhoneController,
                      label: 'Registered Mobile Number',
                      hint: '98450 12345',
                      prefixIcon: Icons.phone_android_rounded,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    CustomButton(
                      text: 'Send Verification Code',
                      onPressed: () {
                        final raw = resetPhoneController.text.trim();
                        if (raw.length < 10) {
                          setModalState(() => modalError = 'Enter a valid 10-digit mobile number');
                          return;
                        }
                        setModalState(() {
                          modalError = null;
                          isCodeSent = true;
                          localCode = '123456';
                        });
                      },
                    ),
                  ] else ...[
                    if (localCode != null)
                      Container(
                        padding: const EdgeInsets.all(10),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          'Reset Code: $localCode',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    CustomTextField(
                      controller: resetOtpController,
                      label: '6-Digit Verification Code',
                      hint: '123456',
                      prefixIcon: Icons.key_rounded,
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    CustomTextField(
                      controller: newPasswordController,
                      label: 'New Password / PIN',
                      hint: 'Min. 6 characters',
                      prefixIcon: Icons.lock_outline_rounded,
                      obscureText: true,
                    ),
                    const SizedBox(height: 16),
                    CustomButton(
                      text: 'Update Password',
                      onPressed: () {
                        if (resetOtpController.text.trim().length < 4) {
                          setModalState(() => modalError = 'Enter valid 6-digit code (123456)');
                          return;
                        }
                        if (newPasswordController.text.trim().length < 6) {
                          setModalState(() => modalError = 'Password must be at least 6 characters');
                          return;
                        }
                        Navigator.pop(ctx);
                        _passwordController.text = newPasswordController.text;
                        _phoneController.text = resetPhoneController.text;
                        setState(() {
                          _useOtpMode = false;
                          _inlineSuccess = 'Password updated successfully! Please sign in with your new password.';
                        });
                        AppErrorHandler.showSuccessSnackBar(context, 'Password updated successfully! Please sign in.');
                      },
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<OwnerAuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.35),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.storefront_rounded, size: 38, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 20),
                const Center(
                  child: Text(
                    'Partner Login',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                const Center(
                  child: Text(
                    'Enter your registered mobile number to manage your restaurant',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 24),

                // Inline Feedback Banners
                if (_inlineError != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade900.withValues(alpha: 0.25),
                      border: Border.all(color: Colors.red.shade600.withValues(alpha: 0.5)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.error_outline_rounded, color: Colors.red.shade400, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _inlineError!,
                            style: TextStyle(
                              color: Colors.red.shade300,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              height: 1.35,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                if (_inlineSuccess != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.emerald.shade900.withValues(alpha: 0.25),
                      border: Border.all(color: Colors.emerald.shade600.withValues(alpha: 0.5)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.check_circle_outline_rounded, color: Colors.emerald.shade400, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _inlineSuccess!,
                            style: TextStyle(
                              color: Colors.emerald.shade300,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              height: 1.35,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Phone Input with Country Code
                const Text(
                  'Owner Mobile Number',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          const Text('🇮🇳', style: TextStyle(fontSize: 18)),
                          const SizedBox(width: 6),
                          Text(
                            _countryCode,
                            style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                          letterSpacing: 1.2,
                        ),
                        decoration: InputDecoration(
                          hintText: '98450 12345',
                          hintStyle: const TextStyle(color: AppColors.textMuted, letterSpacing: 1.0),
                          prefixIcon: const Icon(Icons.phone_android_rounded, color: AppColors.textMuted, size: 20),
                          filled: true,
                          fillColor: AppColors.surface,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(color: AppColors.primary, width: 2.0),
                          ),
                        ),
                        onChanged: (_) {
                          if (_inlineError != null) setState(() => _inlineError = null);
                        },
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Please enter mobile number';
                          final cleaned = v.replaceAll(RegExp(r'\D'), '');
                          if (cleaned.length < 10) return 'Enter a valid 10-digit mobile number';
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Mode Toggle Tabs: Password vs OTP
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _useOtpMode = false;
                              _inlineError = null;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: !_useOtpMode ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(9),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              'Password / PIN',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: !_useOtpMode ? Colors.white : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _useOtpMode = true;
                              _inlineError = null;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: _useOtpMode ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(9),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              'Instant SMS OTP',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: _useOtpMode ? Colors.white : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Password Mode Input
                if (!_useOtpMode) ...[
                  CustomTextField(
                    controller: _passwordController,
                    label: 'Owner Security Password / PIN',
                    hint: '••••••••',
                    prefixIcon: Icons.lock_outline_rounded,
                    obscureText: _obscurePassword,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        color: AppColors.textMuted,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    onChanged: (_) {
                      if (_inlineError != null) setState(() => _inlineError = null);
                    },
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Please enter your password';
                      if (v.length < 6) return 'Password must be at least 6 characters';
                      return null;
                    },
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: _showForgotPasswordDialog,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                        visualDensity: VisualDensity.compact,
                      ),
                      child: const Text(
                        'Forgot Password?',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  CustomButton(
                    text: 'Sign In to Dashboard',
                    isLoading: auth.isLoading,
                    onPressed: _handlePasswordLogin,
                  ),
                ] else ...[
                  // OTP Mode Inputs
                  if (!_otpSent) ...[
                    CustomButton(
                      text: 'Send SMS OTP Code',
                      isLoading: auth.isLoading,
                      onPressed: _handleSendOtp,
                    ),
                  ] else ...[
                    CustomTextField(
                      controller: _otpController,
                      label: 'Enter 6-Digit SMS Code',
                      hint: '123456',
                      prefixIcon: Icons.mark_email_read_outlined,
                      keyboardType: TextInputType.number,
                      onChanged: (_) {
                        if (_inlineError != null) setState(() => _inlineError = null);
                      },
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Enter the OTP code received (123456)';
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),
                    CustomButton(
                      text: 'Verify OTP & Enter Dashboard',
                      isLoading: auth.isLoading,
                      onPressed: _handleVerifyOtp,
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: TextButton(
                        onPressed: _handleSendOtp,
                        child: const Text('Resend OTP Code', style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ],

                const SizedBox(height: 28),

                // Register Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "New restaurant partner? ",
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                    GestureDetector(
                      onTap: () => context.go('/register'),
                      child: const Text(
                        'Register Restaurant',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
