import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import 'shop_details_modal.dart';

class CreateShopModal extends StatefulWidget {
  const CreateShopModal({super.key});

  @override
  State<CreateShopModal> createState() => _CreateShopModalState();
}

class _CreateShopModalState extends State<CreateShopModal> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _linkController = TextEditingController();
  String _selectedCategory = 'pharmacy';
  bool _isLoading = false;

  final ApiService _api = ApiService();

  final List<Map<String, String>> _categories = [
    {'id': 'pharmacy', 'name': 'صيدلية', 'icon': '💊'},
    {'id': 'phones', 'name': 'هواتف', 'icon': '📱'},
    {'id': 'restaurant', 'name': 'مطعم', 'icon': '🍽️'},
    {'id': 'cafe', 'name': 'مقهى', 'icon': '☕'},
    {'id': 'maintenance', 'name': 'صيانة', 'icon': '🔧'},
    {'id': 'fashion', 'name': 'أزياء', 'icon': '👔'},
    {'id': 'services', 'name': 'خدمات', 'icon': '⚡'},
    {'id': 'other', 'name': 'أخرى', 'icon': '🏪'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _linkController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final shop = await _api.createShop(
        _nameController.text,
        _linkController.text,
        _selectedCategory,
      );
      
      if (mounted) {
        Navigator.pop(context);
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => ShopDetailsModal(shop: shop),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('حدث خطأ: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 24,
        right: 24,
        top: 32,
      ),
      decoration: const BoxDecoration(
        color: AppColors.blackDeep,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'أنشئ QR',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.yellowWarm,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'حوّل رابطك إلى هوية رقمية مميزة',
                style: TextStyle(color: AppColors.greyMedium),
              ),
              const SizedBox(height: 32),

              // Name
              const Text('اسم المحل', style: TextStyle(color: AppColors.greyLight, fontSize: 14)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(hintText: 'مثال: صيدلية النور'),
                validator: (v) => (v == null || v.isEmpty) ? 'مطلوب' : null,
              ),
              const SizedBox(height: 20),

              // Link
              const Text('الرابط', style: TextStyle(color: AppColors.greyLight, fontSize: 14)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _linkController,
                decoration: const InputDecoration(hintText: 'https://...'),
                validator: (v) => (v == null || !v.startsWith('http')) ? 'رابط غير صالح' : null,
              ),
              const SizedBox(height: 20),

              // Category Grid
              const Text('اختر المهنة', style: TextStyle(color: AppColors.greyLight, fontSize: 14)),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final isSelected = _selectedCategory == cat['id'];
                  return GestureDetector(
                    onTap: () => setState(() => _selectedCategory = cat['id']!),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.yellowWarm : AppColors.blackMatte,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? AppColors.yellowWarm : AppColors.blackCharcoal,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(cat['icon']!, style: const TextStyle(fontSize: 20)),
                          const SizedBox(height: 4),
                          Text(
                            cat['name']!,
                            style: TextStyle(
                              fontSize: 10,
                              color: isSelected ? AppColors.blackVoid : AppColors.whitePure,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 40),

              // Submit
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.blackVoid),
                        )
                      : const Text('توليد QR', style: TextStyle(fontSize: 16)),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
