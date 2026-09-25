import 'package:flutter/material.dart';
import '../models/category.dart';
import '../models/menu_item.dart';
import '../repositories/menu_repository.dart';

class MenuProvider extends ChangeNotifier {
  final MenuRepository _repository;

  List<MenuCategory> _categories = MenuCategory.getDefaultCategories('default');
  List<MenuItem> _items = [];
  String _selectedCategoryId = 'all';
  String _searchQuery = '';
  bool _isLoading = false;
  String? _errorMessage;

  MenuProvider({MenuRepository? repository}) : _repository = repository ?? MenuRepository();

  List<MenuCategory> get categories => _categories;
  List<MenuItem> get items => _items;
  String get selectedCategoryId => _selectedCategoryId;
  String get searchQuery => _searchQuery;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<MenuItem> get filteredItems {
    return _items.where((item) {
      final matchesCategory = _selectedCategoryId == 'all' || item.categoryId == _selectedCategoryId;
      final matchesSearch = _searchQuery.isEmpty ||
          item.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (item.description ?? '').toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();
  }

  void selectCategory(String categoryId) {
    _selectedCategoryId = categoryId;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> loadMenu(String shopId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final cats = await _repository.fetchCategories(shopId);
      final menu = await _repository.fetchMenuItems(shopId);

      _categories = cats.isNotEmpty ? cats : MenuCategory.getDefaultCategories(shopId);
      _items = menu;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      if (_categories.isEmpty) {
        _categories = MenuCategory.getDefaultCategories(shopId);
      }
      notifyListeners();
    }
  }

  Future<bool> saveItem(MenuItem item) async {
    try {
      final saved = await _repository.saveMenuItem(item);
      final index = _items.indexWhere((i) => i.id == saved.id);
      if (index != -1) {
        _items[index] = saved;
      } else {
        _items.insert(0, saved);
      }
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }

  Future<void> toggleAvailability(String itemId, bool isAvailable) async {
    final index = _items.indexWhere((i) => i.id == itemId);
    if (index == -1) return;

    _items[index] = _items[index].copyWith(isAvailable: isAvailable);
    notifyListeners();

    try {
      await _repository.toggleItemAvailability(itemId, isAvailable);
    } catch (e) {
      _items[index] = _items[index].copyWith(isAvailable: !isAvailable);
      notifyListeners();
    }
  }

  Future<bool> deleteItem(String itemId) async {
    final itemIndex = _items.indexWhere((i) => i.id == itemId);
    if (itemIndex == -1) return false;
    final removed = _items.removeAt(itemIndex);
    notifyListeners();

    try {
      await _repository.deleteMenuItem(itemId);
      return true;
    } catch (e) {
      // rollback on error
      _items.insert(itemIndex, removed);
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> addCategory(String shopId, String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return;

    try {
      final newCat = await _repository.createCategory(shopId, trimmed);
      _categories.add(newCat);
      notifyListeners();
    } catch (e) {
      // Optimistic local category fallback if network error
      final fallbackCat = MenuCategory(
        id: 'cat_${DateTime.now().millisecondsSinceEpoch}',
        shopId: shopId,
        name: trimmed,
        sortOrder: _categories.length + 1,
      );
      _categories.add(fallbackCat);
      notifyListeners();
    }
  }

  Future<bool> deleteCategory(String categoryId) async {
    final catIndex = _categories.indexWhere((c) => c.id == categoryId);
    if (catIndex == -1) return false;

    final removed = _categories.removeAt(catIndex);
    // Disassociate items
    for (int i = 0; i < _items.length; i++) {
      if (_items[i].categoryId == categoryId) {
        _items[i] = _items[i].copyWith(categoryId: null);
      }
    }
    if (_selectedCategoryId == categoryId) {
      _selectedCategoryId = 'all';
    }
    notifyListeners();

    try {
      await _repository.deleteCategory(categoryId);
      return true;
    } catch (e) {
      _categories.insert(catIndex, removed);
      notifyListeners();
      return false;
    }
  }
}
