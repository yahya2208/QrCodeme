import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/constants.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import 'package:url_launcher/url_launcher.dart';

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

          // QR Code
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: QrImageView(
              data: 'qrnexus://${shop.id}',
              version: QrVersions.auto,
              size: 150.0,
              gapless: false,
            ),
          ),
          const SizedBox(height: 32),

          // Actions
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _launchURL(shop.link),
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('زيارة الموقع'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.blackCarbon,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.blackCharcoal),
                ),
                child: IconButton(
                  onPressed: () {}, // TODO: Save QR
                  icon: const Icon(Icons.download, color: AppColors.yellowWarm),
                ),
              ),
            ],
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

  Future<void> _launchURL(String url) async {
    final Uri uri = Uri.parse(url);
    if (!await launchUrl(uri)) {
      throw Exception('Could not launch $url');
    }
  }
}
