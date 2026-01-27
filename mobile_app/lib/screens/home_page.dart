import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../core/constants.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import 'widgets/action_card.dart';
import 'widgets/create_shop_modal.dart';
import 'widgets/stats_row.dart';
import 'widgets/create_nexus_modal.dart';
import 'main_screen.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final ApiService _api = ApiService();
  GlobalStats? _stats;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final stats = await _api.getGlobalStats();
      setState(() => _stats = stats);
    } catch (e) {
      debugPrint('Error loading stats: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  FadeInLeft(
                    child: RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: 'Qr',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w900,
                              color: AppColors.whitePure,
                            ),
                          ),
                          TextSpan(
                            text: 'Id',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w900,
                              color: AppColors.yellowWarm,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  FadeInRight(
                    child: IconButton(
                      onPressed: () {},
                      icon: const Icon(Icons.notifications_none, color: AppColors.greyLight),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 48),

              // Hero
              FadeInDown(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'أنشئ',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        color: AppColors.whitePure,
                        height: 1.1,
                      ),
                    ),
                    Text(
                      'اكتشف',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        color: AppColors.yellowWarm,
                        height: 1.1,
                      ),
                    ),
                    Text(
                      'تواصل',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        color: AppColors.greyMedium,
                        height: 1.1,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              // Actions
              FadeInUp(
                delay: const Duration(milliseconds: 200),
                child: Column(
                  children: [
                    ActionCard(
                      title: 'أنشئ QR',
                      subtitle: 'حوّل رابطك إلى هوية رقمية',
                      icon: Icons.add_box_outlined,
                      color: AppColors.yellowWarm,
                      onTap: () => _showCreateModal(context),
                    ),
                    const SizedBox(height: 16),
                    ActionCard(
                      title: 'اكتشف',
                      subtitle: 'ابحث عن المحلات والخدمات',
                      icon: Icons.search,
                      color: AppColors.whitePure,
                      onTap: () => MainScreen.of(context)?.setTab(1),
                    ),
                    const SizedBox(height: 16),
                    ActionCard(
                      title: 'NEXUS ID',
                      subtitle: 'هويتك الرقمية المتطورة',
                      icon: Icons.auto_awesome_outlined,
                      color: AppColors.yellowNeon.withOpacity(0.5),
                      onTap: () => _showNexusModal(context),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              // Stats
              if (_stats != null)
                FadeInUp(
                  delay: const Duration(milliseconds: 400),
                  child: StatsRow(stats: _stats!),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCreateModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const CreateShopModal(),
    ).then((_) => _loadStats());
  }
  void _showNexusModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const CreateNexusModal(),
    );
  }
}
