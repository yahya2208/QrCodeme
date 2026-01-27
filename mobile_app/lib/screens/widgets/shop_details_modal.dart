import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';

/// Shop Details Modal - QR-CENTRIC DESIGN
/// NO DIRECT LINKS - Only shows QR Code
class ShopDetailsModal extends StatelessWidget {
  final Shop shop;
  final ApiService _api = ApiService();

  ShopDetailsModal({super.key, required this.shop});

  @override
  Widget build(BuildContext context) {
    // Record view
    _api.recordView(shop.id);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: const BoxDecoration(
        color: AppColors.blackDeep,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.blackCharcoal,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 32),

          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.blackCarbon,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.yellowWarm, width: 2),
              boxShadow: const [
                BoxShadow(color: AppColors.yellowGhost, blurRadius: 20, spreadRadius: 5),
              ],
            ),
            child: const Text('🏪', style: TextStyle(fontSize: 40)),
          ),
          const SizedBox(height: 16),
          Text(
            shop.name,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.whitePure,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.blackMatte,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              shop.categoryId,
              style: const TextStyle(color: AppColors.greyLight, fontSize: 12),
            ),
          ),
          const SizedBox(height: 32),

          // QR Code - CENTRAL FEATURE (NO DIRECT LINKS)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppColors.yellowWarm.withOpacity(0.3),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: QrImageView(
              data: shop.link, // The actual link encoded in QR
              version: QrVersions.auto,
              size: 200.0,
              gapless: false,
              backgroundColor: Colors.white,
            ),
          ),
          const SizedBox(height: 24),

          // Instruction (NO "Visit Site" button - QR only paradigm)
          Text(
            'امسح الكود باستخدام كاميرا الهاتف',
            style: GoogleFonts.outfit(
              fontSize: 14,
              color: AppColors.greyMedium,
            ),
          ),
          const SizedBox(height: 32),

          // Download QR Button only (no visit site)
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.blackCarbon,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.yellowWarm.withOpacity(0.3)),
            ),
            child: TextButton.icon(
              onPressed: () {
                // TODO: Save QR to gallery
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('جاري الحفظ...')),
                );
              },
              icon: const Icon(Icons.download, color: AppColors.yellowWarm),
              label: Text(
                'حفظ الكود',
                style: GoogleFonts.outfit(color: AppColors.yellowWarm),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Stats
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildStatItem(shop.views.toString(), 'مشاهدة'),
              const SizedBox(width: 48),
              _buildStatItem(shop.scans.toString(), 'مسحة'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.whitePure,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: AppColors.greyMedium),
        ),
      ],
    );
  }
}
