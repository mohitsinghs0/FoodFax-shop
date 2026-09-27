import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/shop.dart';

class ShopService {
  SupabaseClient get _client => SupabaseService.client;

  Future<Shop?> fetchShopByOwner(String ownerId, {String? phone}) async {
    try {
      var data = await _client
          .from('shops')
          .select()
          .eq('owner_id', ownerId)
          .maybeSingle();

      if (data == null && phone != null && phone.isNotEmpty) {
        final digits = phone.replaceAll(RegExp(r'\D'), '');
        final last10 = digits.length >= 10 ? digits.substring(digits.length - 10) : digits;
        data = await _client
            .from('shops')
            .select()
            .or('phone.eq.$phone,phone.eq.$digits,phone.eq.$last10,phone.eq.+91$last10')
            .maybeSingle();
      }

      if (data == null) return null;
      return Shop.fromJson(data);
    } catch (e) {
      debugPrint('ShopService.fetchShopByOwner error: $e');
      return null;
    }
  }

  Future<Shop> saveShop(Shop shop) async {
    final json = shop.toJson();
    if (shop.id.isEmpty) {
      // Create new shop
      json.remove('id');
      final response = await _client.from('shops').insert(json).select().single();
      return Shop.fromJson(response);
    } else {
      // Update existing shop
      final response = await _client.from('shops').update(json).eq('id', shop.id).select().single();
      return Shop.fromJson(response);
    }
  }

  Future<void> toggleShopStatus(String shopId, bool isOpen) async {
    await _client.from('shops').update({'is_open': isOpen}).eq('id', shopId);
  }

  Future<void> toggleRushMode(String shopId, bool isRushMode, {int extraMinutes = 15}) async {
    await _client.from('shops').update({
      'is_rush_mode': isRushMode,
      'rush_extra_minutes': extraMinutes,
    }).eq('id', shopId);
  }
}
