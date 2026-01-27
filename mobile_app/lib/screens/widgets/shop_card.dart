import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../models/models.dart';
import 'shop_details_modal.dart';

class ShopCard extends StatelessWidget {
  final Shop shop;

  const ShopCard({super.key, required this.shop});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.blackCarbon,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.blackCharcoal),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (context) => ShopDetailsModal(shop: shop),
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.blackMatte,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('🏪', style: TextStyle(fontSize: 24)),
                ),
                const Spacer(),
                Text(
                  shop.name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.whitePure,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.remove_red_eye_outlined, size: 12, color: AppColors.greyMedium),
                    const SizedBox(width: 4),
                    Text(
                      '${shop.views} مشاهدة',
                      style: const TextStyle(fontSize: 10, color: AppColors.greyMedium),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.qr_code_2, size: 12, color: AppColors.greyMedium),
                    const SizedBox(width: 4),
                    Text(
                      '${shop.scans} مسحة',
                      style: const TextStyle(fontSize: 10, color: AppColors.greyMedium),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
