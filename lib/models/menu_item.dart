class MenuItem {
  final String id;
  final String shopId;
  final String? categoryId;
  final String name;
  final String? description;
  final double price;
  final bool isVeg;
  final bool isAvailable;
  final String? imageUrl;
  final int preparationTimeMinutes;
  final String? tag; // 'Bestseller', 'Chef Special', 'Must Try'
  final DateTime? createdAt;

  MenuItem({
    required this.id,
    required this.shopId,
    this.categoryId,
    required this.name,
    this.description,
    required this.price,
    this.isVeg = true,
    this.isAvailable = true,
    this.imageUrl,
    this.preparationTimeMinutes = 15,
    this.tag,
    this.createdAt,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id']?.toString() ?? '',
      shopId: json['shop_id']?.toString() ?? '',
      categoryId: json['category_id']?.toString(),
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      isVeg: json['is_veg'] as bool? ?? true,
      isAvailable: json['is_available'] as bool? ?? true,
      imageUrl: json['image'] as String? ?? json['image_url'] as String?,
      preparationTimeMinutes: (json['preparation_time_min'] as num?)?.toInt() ??
          (json['preparation_time_minutes'] as num?)?.toInt() ?? 15,
      tag: (json['is_bestseller'] == true) ? 'Bestseller' : (json['tag'] as String?),
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'shop_id': shopId,
      'category_id': categoryId,
      'name': name,
      'description': description,
      'price': price,
      'is_veg': isVeg,
      'is_available': isAvailable,
      'image': imageUrl,
      'preparation_time_min': preparationTimeMinutes,
      'preparation_minutes': '$preparationTimeMinutes-${preparationTimeMinutes + 5}',
      'is_bestseller': tag == 'Bestseller',
      'is_active': true,
    };
  }

  MenuItem copyWith({
    String? categoryId,
    String? name,
    String? description,
    double? price,
    bool? isVeg,
    bool? isAvailable,
    String? imageUrl,
    int? preparationTimeMinutes,
    String? tag,
  }) {
    return MenuItem(
      id: id,
      shopId: shopId,
      categoryId: categoryId ?? this.categoryId,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      isVeg: isVeg ?? this.isVeg,
      isAvailable: isAvailable ?? this.isAvailable,
      imageUrl: imageUrl ?? this.imageUrl,
      preparationTimeMinutes: preparationTimeMinutes ?? this.preparationTimeMinutes,
      tag: tag ?? this.tag,
      createdAt: createdAt,
    );
  }
}
