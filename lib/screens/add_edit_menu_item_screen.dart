import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/shop_provider.dart';
import '../providers/menu_provider.dart';
import '../models/category.dart';
import '../models/menu_item.dart';
import '../theme/app_colors.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';

class AddEditMenuItemScreen extends StatefulWidget {
  final String? itemId;

  const AddEditMenuItemScreen({super.key, this.itemId});

  @override
  State<AddEditMenuItemScreen> createState() => _AddEditMenuItemScreenState();
}

class _AddEditMenuItemScreenState extends State<AddEditMenuItemScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _prepTimeController = TextEditingController(text: '15');

  String? _selectedCategoryId;
  bool _isVeg = true;
  bool _isAvailable = true;
  String? _selectedTag;
  bool _isSubmitting = false;

  final List<String> _tags = ['Bestseller', "Chef's Special", 'Must Try', 'Spicy', 'New'];

  @override
  void initState() {
    super.initState();
    if (widget.itemId != null) {
      final menuProvider = context.read<MenuProvider>();
      final item = menuProvider.items.firstWhere(
        (i) => i.id == widget.itemId,
        orElse: () => throw Exception('Item not found'),
      );
      _nameController.text = item.name;
      _descController.text = item.description ?? '';
      _priceController.text = item.price.toStringAsFixed(0);
      _prepTimeController.text = item.preparationTimeMinutes.toString();
      _selectedCategoryId = item.categoryId;
      _isVeg = item.isVeg;
      _isAvailable = item.isAvailable;
      _selectedTag = item.tag;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _prepTimeController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final shop = context.read<ShopProvider>().currentShop;
    if (shop == null) return;

    setState(() => _isSubmitting = true);

    final item = MenuItem(
      id: widget.itemId ?? '',
      shopId: shop.id,
      categoryId: _selectedCategoryId,
      name: _nameController.text.trim(),
      description: _descController.text.trim(),
      price: double.tryParse(_priceController.text.trim()) ?? 0.0,
      preparationTimeMinutes: int.tryParse(_prepTimeController.text.trim()) ?? 15,
      isVeg: _isVeg,
      isAvailable: _isAvailable,
      tag: _selectedTag,
    );

    final success = await context.read<MenuProvider>().saveItem(item);
    setState(() => _isSubmitting = false);

    if (mounted && success) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final menuProvider = context.watch<MenuProvider>();
    final isEditing = widget.itemId != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Menu Dish' : 'Add New Dish'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Dish Name
              CustomTextField(
                controller: _nameController,
                label: 'Dish / Item Name',
                hint: 'e.g. Paneer Butter Masala',
                prefixIcon: Icons.restaurant,
                validator: (v) => (v == null || v.isEmpty) ? 'Please enter dish name' : null,
              ),
              const SizedBox(height: 18),

              // Category Selector
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Category', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                      TextButton.icon(
                        onPressed: () => _showAddCategoryDialog(context),
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('New Category', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: () {
                          final cats = menuProvider.categories.isNotEmpty
                              ? menuProvider.categories
                              : MenuCategory.getDefaultCategories('default');
                          if (_selectedCategoryId != null && cats.any((c) => c.id == _selectedCategoryId)) {
                            return _selectedCategoryId;
                          }
                          return cats.isNotEmpty ? cats.first.id : null;
                        }(),
                        isExpanded: true,
                        hint: const Text('Select Menu Category'),
                        dropdownColor: AppColors.surface,
                        items: [
                          ...(menuProvider.categories.isNotEmpty
                                  ? menuProvider.categories
                                  : MenuCategory.getDefaultCategories('default'))
                              .map((cat) {
                            return DropdownMenuItem(value: cat.id, child: Text(cat.name));
                          }),
                          const DropdownMenuItem(
                            value: '__add_new__',
                            child: Text('➕ + Add New Category...', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                          ),
                        ],
                        onChanged: (val) {
                          if (val == '__add_new__') {
                            _showAddCategoryDialog(context);
                          } else {
                            setState(() => _selectedCategoryId = val);
                          }
                        },
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Price & Prep Time
              Row(
                children: [
                  Expanded(
                    child: CustomTextField(
                      controller: _priceController,
                      label: 'Price (₹)',
                      hint: '249',
                      prefixIcon: Icons.currency_rupee,
                      keyboardType: TextInputType.number,
                      validator: (v) => (v == null || v.isEmpty) ? 'Enter price' : null,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: CustomTextField(
                      controller: _prepTimeController,
                      label: 'Prep Time (Mins)',
                      hint: '15',
                      prefixIcon: Icons.timer,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Description
              CustomTextField(
                controller: _descController,
                label: 'Description / Ingredients',
                hint: 'Cottage cheese cubes tossed in rich tomato and cashew gravy...',
                maxLines: 3,
              ),
              const SizedBox(height: 20),

              // Dietary Type (Veg / Non-Veg)
              const Text('Dietary Classification', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _isVeg = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _isVeg ? AppColors.vegGreen.withOpacity(0.15) : AppColors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: _isVeg ? AppColors.vegGreen : AppColors.cardBorder, width: 2),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.eco, color: AppColors.vegGreen, size: 18),
                            SizedBox(width: 8),
                            Text('VEGETARIAN', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.vegGreen)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _isVeg = false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: !_isVeg ? AppColors.nonVegRed.withOpacity(0.15) : AppColors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: !_isVeg ? AppColors.nonVegRed : AppColors.cardBorder, width: 2),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.kebab_dining, color: AppColors.nonVegRed, size: 18),
                            SizedBox(width: 8),
                            Text('NON-VEG', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.nonVegRed)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Tags
              const Text('Special Badge / Tag', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('None'),
                    selected: _selectedTag == null,
                    onSelected: (_) => setState(() => _selectedTag = null),
                  ),
                  ..._tags.map((tag) {
                    final isSelected = _selectedTag == tag;
                    return ChoiceChip(
                      label: Text(tag),
                      selected: isSelected,
                      selectedColor: AppColors.primary.withOpacity(0.2),
                      onSelected: (_) => setState(() => _selectedTag = isSelected ? null : tag),
                    );
                  }),
                ],
              ),
              const SizedBox(height: 20),

              // Availability Switch
              SwitchListTile(
                value: _isAvailable,
                onChanged: (val) => setState(() => _isAvailable = val),
                title: const Text('In Stock & Ready to Order', style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Turn off if temporarily sold out', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                activeColor: Colors.greenAccent,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 32),

              CustomButton(
                text: isEditing ? 'Update Dish Details' : 'Save Dish to Menu',
                isLoading: _isSubmitting,
                onPressed: _handleSave,
              ),

              if (isEditing) ...[
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: () => _confirmDeleteCurrentItem(context),
                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                  label: const Text('Delete Dish from Menu', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.redAccent),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showAddCategoryDialog(BuildContext context) {
    final catController = TextEditingController();
    final shop = context.read<ShopProvider>().currentShop;

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Add Menu Category', style: TextStyle(fontWeight: FontWeight.w800)),
          content: TextField(
            controller: catController,
            decoration: const InputDecoration(hintText: 'e.g. Starters, Rolls, Beverages'),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final text = catController.text.trim();
                if (text.isNotEmpty && shop != null) {
                  await context.read<MenuProvider>().addCategory(shop.id, text);
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
  }

  void _confirmDeleteCurrentItem(BuildContext context) {
    final menuProvider = context.read<MenuProvider>();
    final itemId = widget.itemId;
    if (itemId == null) return;

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Delete Dish?', style: TextStyle(fontWeight: FontWeight.w800)),
          content: Text('Are you sure you want to remove "${_nameController.text}" from your menu?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                final success = await menuProvider.deleteItem(itemId);
                if (mounted && success) {
                  Navigator.pop(context);
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
  }
}
