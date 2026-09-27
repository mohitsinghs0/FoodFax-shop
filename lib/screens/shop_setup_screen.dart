import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/error_handler.dart';
import '../models/shop.dart';
import '../providers/auth_provider.dart';
import '../providers/shop_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';

class ShopSetupScreen extends StatefulWidget {
  const ShopSetupScreen({super.key});

  @override
  State<ShopSetupScreen> createState() => _ShopSetupScreenState();
}

class _ShopSetupScreenState extends State<ShopSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _areaController = TextEditingController();
  final _cityController = TextEditingController();
  final _upiController = TextEditingController();
  String _selectedShopType = 'Restaurant';

  final List<String> _shopTypes = [
    'Restaurant',
    'Cafe',
    'Fast Food & Street Stall',
    'Bakery & Desserts',
    'Cloud Kitchen',
    'Beverages & Juices',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _upiController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<OwnerAuthProvider>();
    final shopProvider = context.read<ShopProvider>();
    final ownerId = auth.profile?.id ?? auth.currentUser?.id ?? '';

    final newShop = Shop(
      id: '',
      ownerId: ownerId,
      name: _nameController.text.trim(),
      shopType: _selectedShopType,
      phone: _phoneController.text.trim(),
      address: _addressController.text.trim(),
      area: _areaController.text.trim(),
      city: _cityController.text.trim(),
      upiId: _upiController.text.trim(),
      isOpen: true,
      acceptsTakeaway: true,
      acceptsDineIn: true,
      acceptsDelivery: false,
    );

    final success = await shopProvider.saveShop(newShop);
    if (!mounted) return;

    if (success) {
      context.go('/dashboard');
    } else if (shopProvider.errorMessage != null) {
      AppErrorHandler.showErrorSnackBar(context, shopProvider.errorMessage!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shopProvider = context.watch<ShopProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Setup Restaurant Profile'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Basic Shop Details',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Customers will see this name and address when placing orders.',
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 24),
                CustomTextField(
                  controller: _nameController,
                  label: 'Restaurant / Stall Name',
                  hint: 'e.g. Royal Spice Kitchen',
                  prefixIcon: Icons.storefront,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter shop name' : null,
                ),
                const SizedBox(height: 18),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Shop Category',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedShopType,
                          isExpanded: true,
                          dropdownColor: AppColors.surface,
                          items: _shopTypes.map((type) {
                            return DropdownMenuItem(value: type, child: Text(type));
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedShopType = val);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                CustomTextField(
                  controller: _phoneController,
                  label: 'Store Contact Phone',
                  hint: '9876543210',
                  prefixIcon: Icons.phone,
                  keyboardType: TextInputType.phone,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter contact phone' : null,
                ),
                const SizedBox(height: 18),
                CustomTextField(
                  controller: _addressController,
                  label: 'Street Address',
                  hint: 'Shop 4, Market Complex',
                  prefixIcon: Icons.location_on_outlined,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter street address' : null,
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _areaController,
                        label: 'Area / Locality',
                        hint: 'Indiranagar',
                        prefixIcon: Icons.map_outlined,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CustomTextField(
                        controller: _cityController,
                        label: 'City',
                        hint: 'Bengaluru',
                        prefixIcon: Icons.location_city,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                CustomTextField(
                  controller: _upiController,
                  label: 'Shop UPI ID for Direct Settlements',
                  hint: 'foodfax@okhdfcbank',
                  prefixIcon: Icons.qr_code,
                ),
                const SizedBox(height: 32),
                CustomButton(
                  text: 'Save & Launch Dashboard',
                  isLoading: shopProvider.isLoading,
                  onPressed: _handleSave,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
