import '../models/shop.dart';
import '../services/shop_service.dart';

class ShopRepository {
  final ShopService _shopService;

  ShopRepository({ShopService? shopService}) : _shopService = shopService ?? ShopService();

  Future<Shop?> fetchShopByOwner(String ownerId, {String? phone}) =>
      _shopService.fetchShopByOwner(ownerId, phone: phone);

  Future<Shop> saveShop(Shop shop) => _shopService.saveShop(shop);

  Future<void> toggleShopStatus(String shopId, bool isOpen) => _shopService.toggleShopStatus(shopId, isOpen);

  Future<void> toggleRushMode(String shopId, bool isRushMode, {int extraMinutes = 15}) async =>
      _shopService.toggleRushMode(shopId, isRushMode, extraMinutes: extraMinutes);
}
