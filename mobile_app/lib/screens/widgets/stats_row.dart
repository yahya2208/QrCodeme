import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../models/models.dart';

class StatsRow extends StatelessWidget {
  final GlobalStats stats;

  const StatsRow({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        color: AppColors.blackCarbon,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.blackCharcoal),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildStatItem('كود QR', stats.totalQRCodes.toString()),
          _buildDivider(),
          _buildStatItem('مسحة', stats.totalScans.toString()),
          _buildDivider(),
          _buildStatItem('فئة', stats.totalCategories.toString()),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w900,
            color: AppColors.yellowWarm,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.greyMedium,
            letterSpacing: 2,
          ),
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 40,
      width: 1,
      color: AppColors.blackCharcoal,
    );
  }
}
