class MenuCategory {
  final String id;
  final String shopId;
  final String name;
  final String? description;
  final int sortOrder;
  final bool isActive;

  MenuCategory({
    required this.id,
    required this.shopId,
    required this.name,
    this.description,
    this.sortOrder = 0,
    this.isActive = true,
  });

  factory MenuCategory.fromJson(Map<String, dynamic> json) {
    return MenuCategory(
      id: json['id']?.toString() ?? '',
      shopId: json['shop_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description'] as String?,
      sortOrder: (json['display_order'] as num?)?.toInt() ??
          (json['sort_order'] as num?)?.toInt() ?? 0,
      isActive: json['is_active'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'shop_id': shopId,
      'name': name,
      'description': description,
      'display_order': sortOrder,
      'is_active': isActive,
    };
  }

  static List<MenuCategory> getDefaultCategories(String shopId) {
    return [
      MenuCategory(id: 'cat-1', shopId: shopId, name: 'Vada Pav & Chaat', sortOrder: 1),
      MenuCategory(id: 'cat-2', shopId: shopId, name: 'Chai & Beverages', sortOrder: 2),
      MenuCategory(id: 'cat-3', shopId: shopId, name: 'Rolls & Fast Food', sortOrder: 3),
      MenuCategory(id: 'cat-4', shopId: shopId, name: 'Thali & Meals', sortOrder: 4),
      MenuCategory(id: 'cat-5', shopId: shopId, name: 'Desserts & Shakes', sortOrder: 5),
      MenuCategory(id: 'cat-6', shopId: shopId, name: 'Snacks & Starters', sortOrder: 6),
      MenuCategory(id: 'cat-7', shopId: shopId, name: 'South Indian & Dosa', sortOrder: 7),
      MenuCategory(id: 'cat-8', shopId: shopId, name: 'Chinese & Noodles', sortOrder: 8),
      MenuCategory(id: 'cat-9', shopId: shopId, name: 'Burgers & Sandwiches', sortOrder: 9),
    ];
  }
}
