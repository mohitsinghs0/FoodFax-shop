import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../models/order.dart';

class OrderService {
  SupabaseClient get _client => SupabaseService.client;
  RealtimeChannel? _subscription;

  Future<List<OwnerOrder>> fetchOrders(String shopId, {String? status}) async {
    try {
      var query = _client
          .from('orders')
          .select('''
            *,
            order_items (
              *,
              menu_items (*)
            )
          ''')
          .eq('shop_id', shopId);

      if (status != null && status.isNotEmpty && status != 'all') {
        query = query.eq('status', status);
      }

      final response = await query.order('created_at', ascending: false);
      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => OwnerOrder.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('OrderService.fetchOrders error: $e');
      return [];
    }
  }

  Stream<List<Map<String, dynamic>>> subscribeToOrders(String shopId) {
    final streamController = StreamController<List<Map<String, dynamic>>>.broadcast();

    _subscription?.unsubscribe();
    _subscription = _client
        .channel('public:orders:shop_id=$shopId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'orders',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'shop_id',
            value: shopId,
          ),
          callback: (payload) async {
            // Refetch fresh orders when changes occur
            try {
              final response = await _client
                  .from('orders')
                  .select('''
                    *,
                    order_items (
                      *,
                      menu_items (*)
                    )
                  ''')
                  .eq('shop_id', shopId)
                  .order('created_at', ascending: false);
              if (!streamController.isClosed) {
                streamController.add(List<Map<String, dynamic>>.from(response as List));
              }
            } catch (e) {
              debugPrint('Realtime order fetch error: $e');
            }
          },
        )
        .subscribe();

    return streamController.stream;
  }

  Future<void> updateOrderStatus({
    required String orderId,
    required String newStatus,
    String? cancellationReason,
    int? estimatedPrepMinutes,
  }) async {
    final updates = <String, dynamic>{
      'status': newStatus,
      'updated_at': DateTime.now().toIso8601String(),
    };

    if (cancellationReason != null) {
      updates['cancellation_reason'] = cancellationReason;
    }
    if (estimatedPrepMinutes != null) {
      updates['estimated_prep_minutes'] = estimatedPrepMinutes;
    }

    await _client.from('orders').update(updates).eq('id', orderId);
  }

  void unsubscribe() {
    _subscription?.unsubscribe();
    _subscription = null;
  }
}
