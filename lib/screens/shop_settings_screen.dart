import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/error_handler.dart';
import '../models/shop.dart';
import '../providers/shop_provider.dart';
import '../theme/app_colors.dart';
import '../widgets/custom_button.dart';

class ShopSettingsScreen extends StatefulWidget {
  const ShopSettingsScreen({super.key});

  @override
  State<ShopSettingsScreen> createState() => _ShopSettingsScreenState();
}

class _ShopSettingsScreenState extends State<ShopSettingsScreen> {
  late bool _acceptsTakeaway;
  late bool _acceptsDineIn;
  late bool _acceptsDelivery;
  late int _rushMinutes;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      final shop = context.read<ShopProvider>().currentShop;
      _acceptsTakeaway = shop?.acceptsTakeaway ?? true;
      _acceptsDineIn = shop?.acceptsDineIn ?? true;
      _acceptsDelivery = shop?.acceptsDelivery ?? false;
      _rushMinutes = shop?.rushExtraMinutes ?? 15;
      _initialized = true;
    }
  }

  Future<void> _handleSave() async {
    final shopProvider = context.read<ShopProvider>();
    final current = shopProvider.currentShop;
    if (current == null) return;

    final updated = Shop(
      id: current.id,
      ownerId: current.ownerId,
      name: current.name,
      shopType: current.shopType,
      description: current.description,
      phone: current.phone,
      address: current.address,
      area: current.area,
      city: current.city,
      upiId: current.upiId,
      isOpen: current.isOpen,
      isRushMode: current.isRushMode,
      rushExtraMinutes: _rushMinutes,
      minimumOrder: current.minimumOrder,
      acceptsTakeaway: _acceptsTakeaway,
      acceptsDineIn: _acceptsDineIn,
      acceptsDelivery: _acceptsDelivery,
    );

    final success = await shopProvider.saveShop(updated);
    if (!mounted) return;

    if (success) {
      AppErrorHandler.showSuccessSnackBar(context, 'Settings updated successfully!');
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
        title: const Text('Store & Kitchen Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Order Fulfillment Types',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 10),
          Card(
            color: AppColors.surface,
            child: Column(
              children: [
                SwitchListTile(
                  activeColor: AppColors.primary,
                  title: const Text('Takeaway / Counter Pickup'),
                  subtitle: const Text('Allow customers to order and pick up from stall', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  value: _acceptsTakeaway,
                  onChanged: (val) => setState(() => _acceptsTakeaway = val),
                ),
                const Divider(height: 1, color: AppColors.border),
                SwitchListTile(
                  activeColor: AppColors.primary,
                  title: const Text('Dine-In / Table Orders'),
                  subtitle: const Text('Allow scanning QR on tables to order', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  value: _acceptsDineIn,
                  onChanged: (val) => setState(() => _acceptsDineIn = val),
                ),
                const Divider(height: 1, color: AppColors.border),
                SwitchListTile(
                  activeColor: AppColors.primary,
                  title: const Text('Direct Store Delivery'),
                  subtitle: const Text('Accept direct home delivery orders', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  value: _acceptsDelivery,
                  onChanged: (val) => setState(() => _acceptsDelivery = val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Kitchen Rush Buffer',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 10),
          Card(
            color: AppColors.surface,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Extra prep time when Rush Mode is active: $_rushMinutes minutes',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Slider(
                    value: _rushMinutes.toDouble(),
                    min: 5,
                    max: 45,
                    divisions: 8,
                    activeColor: AppColors.primary,
                    label: '+$_rushMinutes mins',
                    onChanged: (val) => setState(() => _rushMinutes = val.round()),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
          CustomButton(
            text: 'Save Settings',
            isLoading: shopProvider.isLoading,
            onPressed: _handleSave,
          ),
        ],
      ),
    );
  }
}
