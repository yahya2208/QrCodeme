import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../core/constants.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import 'widgets/shop_card.dart';

class DiscoverPage extends StatefulWidget {
  const DiscoverPage({super.key});

  @override
  State<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends State<DiscoverPage> {
  final ApiService _api = ApiService();
  List<Shop> _shops = [];
  List<Category> _categories = [];
  String _selectedCategory = 'all';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final futures = await Future.wait([
        _api.getCategories(),
        _api.getShops(category: _selectedCategory),
      ]);
      setState(() {
        _categories = futures[0] as List<Category>;
        _shops = futures[1] as List<Shop>;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading discover data: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _filterByCategory(String catId) async {
    setState(() {
      _selectedCategory = catId;
      _isLoading = true;
    });
    try {
      final shops = await _api.getShops(category: catId);
      setState(() {
        _shops = shops;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error filtering shops: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('اكتشف المحلات', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.tune, color: AppColors.greyLight)),
        ],
      ),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'ابحث عن محل أو خدمة...',
                prefixIcon: const Icon(Icons.search, color: AppColors.greyMedium),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.mic_none, color: AppColors.greyMedium),
                  onPressed: () {},
                ),
              ),
              onChanged: (value) {
                if (value.length > 2) {
                   // TODO: Implement search
                }
              },
            ),
          ),

          // Categories
          if (_categories.isNotEmpty)
            SizedBox(
              height: 60,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length + 1,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return _buildCategoryChip('الكل', 'all', '🌟');
                  }
                  final cat = _categories[index - 1];
                  return _buildCategoryChip(cat.nameAr, cat.id, cat.icon);
                },
              ),
            ),

          // Grid
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.yellowWarm))
                : _shops.isEmpty
                    ? _buildEmptyState()
                    : GridView.builder(
                        padding: const EdgeInsets.all(20),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 0.8,
                        ),
                        itemCount: _shops.length,
                        itemBuilder: (context, index) {
                          return FadeInUp(
                            delay: Duration(milliseconds: index * 50),
                            child: ShopCard(shop: _shops[index]),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String label, String id, String icon) {
    bool isSelected = _selectedCategory == id;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Row(
          children: [
            Text(icon),
            const SizedBox(width: 8),
            Text(label),
          ],
        ),
        selected: isSelected,
        onSelected: (_) => _filterByCategory(id),
        backgroundColor: AppColors.blackCarbon,
        selectedColor: AppColors.yellowWarm,
        checkmarkColor: AppColors.blackVoid,
        labelStyle: TextStyle(
          color: isSelected ? AppColors.blackVoid : AppColors.whitePure,
          fontWeight: FontWeight.bold,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
          side: BorderSide(
            color: isSelected ? AppColors.yellowWarm : AppColors.blackCharcoal,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.storefront_outlined, size: 80, color: AppColors.greyDark),
          const SizedBox(height: 16),
          const Text(
            'لا توجد محلات حالياً',
            style: TextStyle(color: AppColors.greyMedium, fontSize: 16),
          ),
        ],
      ),
    );
  }
}
