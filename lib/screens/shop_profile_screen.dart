import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/error_handler.dart';
import '../models/shop.dart';
import '../providers/shop_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';

class ShopProfileScreen extends StatefulWidget {
  const ShopProfileScreen({super.key});

  @override
  State<ShopProfileScreen> createState() => _ShopProfileScreenState();
}

class _ShopProfileScreenState extends State<ShopProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;
  late TextEditingController _areaController;
  late TextEditingController _cityController;
  late TextEditingController _descController;
  late TextEditingController _upiController;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      final shop = context.read<ShopProvider>().currentShop;
      _nameController = TextEditingController(text: shop?.name ?? '');
      _phoneController = TextEditingController(text: shop?.phone ?? '');
      _addressController = TextEditingController(text: shop?.address ?? '');
      _areaController = TextEditingController(text: shop?.area ?? '');
      _cityController = TextEditingController(text: shop?.city ?? '');
      _descController = TextEditingController(text: shop?.description ?? '');
      _upiController = TextEditingController(text: shop?.upiId ?? '');
      _initialized = true;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _descController.dispose();
    _upiController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    final shopProvider = context.read<ShopProvider>();
    final current = shopProvider.currentShop;
    if (current == null) return;

    final updated = Shop(
      id: current.id,
      ownerId: current.ownerId,
      name: _nameController.text.trim(),
      shopType: current.shopType,
      description: _descController.text.trim(),
      phone: _phoneController.text.trim(),
      address: _addressController.text.trim(),
      area: _areaController.text.trim(),
      city: _cityController.text.trim(),
      upiId: _upiController.text.trim(),
      isOpen: current.isOpen,
      isRushMode: current.isRushMode,
      rushExtraMinutes: current.rushExtraMinutes,
      minimumOrder: current.minimumOrder,
      acceptsTakeaway: current.acceptsTakeaway,
      acceptsDineIn: current.acceptsDineIn,
      acceptsDelivery: current.acceptsDelivery,
    );

    final success = await shopProvider.saveShop(updated);
    if (!mounted) return;

    if (success) {
      AppErrorHandler.showSuccessSnackBar(context, 'Shop profile updated successfully!');
      Navigator.pop(context);
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
        title: const Text('Edit Shop Profile'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CustomTextField(
                  controller: _nameController,
                  label: 'Store Name',
                  prefixIcon: Icons.storefront,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter shop name' : null,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _phoneController,
                  label: 'Customer Contact Phone',
                  prefixIcon: Icons.phone,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _descController,
                  label: 'Short Description / Specialties',
                  hint: 'Authentic North Indian curries & biryanis',
                  prefixIcon: Icons.notes,
                  maxLines: 2,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _addressController,
                  label: 'Full Street Address',
                  prefixIcon: Icons.location_on_outlined,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _areaController,
                        label: 'Area / Neighborhood',
                        prefixIcon: Icons.map_outlined,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CustomTextField(
                        controller: _cityController,
                        label: 'City',
                        prefixIcon: Icons.location_city,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _upiController,
                  label: 'Store UPI ID for Instant Payments',
                  prefixIcon: Icons.qr_code,
                ),
                const SizedBox(height: 30),
                CustomButton(
                  text: 'Save Changes',
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
