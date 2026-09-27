import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/category.dart';
import '../models/menu_item.dart';

class MenuService {
  final SupabaseClient _client = SupabaseService.client;

  /// Fetch Categories (both shop-specific and global)
  Future<List<MenuCategory>> fetchCategories(String shopId) async {
    try {
      final res = await _client
          .from('categories')
          .select()
          .or('shop_id.eq.$shopId,shop_id.is.null')
          .order('display_order', ascending: true);

      final list = (res as List).map((c) => MenuCategory.fromJson(c)).toList();
      if (list.isNotEmpty) return list;
      return MenuCategory.getDefaultCategories(shopId);
    } catch (_) {
      return MenuCategory.getDefaultCategories(shopId);
    }
  }

  /// Create Category
  Future<MenuCategory> createCategory(String shopId, String name, {String? description}) async {
    final res = await _client.from('categories').insert({
      'shop_id': shopId,
      'name': name.trim(),
      'description': description?.trim(),
      'display_order': 0,
      'is_active': true,
      'created_at': DateTime.now().toIso8601String(),
    }).select().single();
    return MenuCategory.fromJson(res);
  }

  /// Delete Category
  Future<void> deleteCategory(String categoryId) async {
    try {
      // Disassociate items first so foreign keys don't fail
      await _client.from('menu_items').update({'category_id': null}).eq('category_id', categoryId);
      await _client.from('categories').delete().eq('id', categoryId);
    } catch (_) {
      await _client.from('categories').update({'is_active': false}).eq('id', categoryId);
    }
  }

  /// Fetch Menu Items (excluding soft-deleted)
  Future<List<MenuItem>> fetchMenuItems(String shopId, {String? categoryId}) async {
    try {
      var query = _client
          .from('menu_items')
          .select()
          .eq('shop_id', shopId)
          .or('is_active.eq.true,is_active.is.null');

      if (categoryId != null && categoryId != 'all') {
        query = query.eq('category_id', categoryId);
      }

      final res = await query.order('name', ascending: true);
      return (res as List).map((m) => MenuItem.fromJson(m)).toList();
    } catch (_) {
      return [];
    }
  }

  /// Save or Update Menu Item
  Future<MenuItem> saveMenuItem(MenuItem item) async {
    final data = item.toJson();
    if (item.id.isEmpty) {
      data.remove('id');
    }

    final res = await _client
        .from('menu_items')
        .upsert(data)
        .select()
        .single();
    return MenuItem.fromJson(res);
  }

  /// Toggle item availability
  Future<void> toggleItemAvailability(String itemId, bool isAvailable) async {
    await _client.from('menu_items').update({
      'is_available': isAvailable,
    }).eq('id', itemId);
  }

  /// Delete menu item (with soft-delete fallback if referenced in past orders)
  Future<void> deleteMenuItem(String itemId) async {
    try {
      await _client.from('menu_items').delete().eq('id', itemId);
    } catch (_) {
      await _client.from('menu_items').update({
        'is_active': false,
        'is_available': false,
      }).eq('id', itemId);
    }
  }
}
