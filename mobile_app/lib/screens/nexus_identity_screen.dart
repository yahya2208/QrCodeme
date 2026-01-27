import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../core/constants.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class NexusIdentityScreen extends StatefulWidget {
  final String identityId;

  const NexusIdentityScreen({super.key, required this.identityId});

  @override
  State<NexusIdentityScreen> createState() => _NexusIdentityScreenState();
}

class _NexusIdentityScreenState extends State<NexusIdentityScreen> with SingleTickerProviderStateMixin {
  final ApiService _api = ApiService();
  NexusIdentity? _identity;
  bool _isRevealed = false;
  bool _error = false;
  
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    _loadIdentity();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _loadIdentity() async {
    try {
      final identity = await _api.getNexusIdentity(widget.identityId);
      // Artificial delay for the cinematic reveal
      await Future.delayed(const Duration(milliseconds: 1000));
      if (mounted) {
        setState(() {
          _identity = identity;
          _isRevealed = true;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.blackVoid,
      body: Stack(
        children: [
          // The Living Content
          if (_isRevealed && _identity != null) _buildIdentitySpace(),

          // The Cinematic Entrance (Black Overlay)
          if (!_isRevealed) _buildInitialVoid(),
          
          if (_error) _buildErrorState(),
        ],
      ),
    );
  }

  Widget _buildInitialVoid() {
    return Container(
      color: AppColors.blackVoid,
      child: Center(
        child: FadeIn(
          duration: const Duration(seconds: 2),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 2,
                height: 40,
                color: AppColors.yellowNeon.withOpacity(0.3),
              ),
              const SizedBox(height: 16),
              Text(
                'NEXUS ID',
                style: GoogleFonts.outfit(
                  color: AppColors.whitePure.withOpacity(0.5),
                  letterSpacing: 10,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIdentitySpace() {
    final status = _identity!.temporalStatus;
    
    return Container(
      decoration: BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.topCenter,
          radius: 1.5,
          colors: [
            _getTemporalColor(status).withOpacity(0.1),
            AppColors.blackVoid,
          ],
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
          child: Column(
            children: [
              const SizedBox(height: 40),
              
              // Identity Core (The Sun)
              FadeInDown(
                duration: const Duration(seconds: 2),
                child: Center(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Glow Pulse
                      ScaleTransition(
                        scale: Tween(begin: 1.0, end: 1.2).animate(
                          CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
                        ),
                        child: Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.yellowWarm.withOpacity(0.2 * _identity!.pulse),
                                blurRadius: 40,
                                spreadRadius: 10,
                              ),
                            ],
                          ),
                        ),
                      ),
                      
                      // Core
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.yellowWarm, width: 0.5),
                          color: AppColors.blackCarbon,
                        ),
                        child: const Text('✧', style: TextStyle(fontSize: 40, color: AppColors.yellowWarm)),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 40),
              
              // Name & Bio
              FadeInDown(
                delay: const Duration(milliseconds: 500),
                child: Column(
                  children: [
                    Text(
                      _identity!.displayName,
                      style: GoogleFonts.outfit(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: AppColors.whitePure,
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (_identity!.bio != null)
                      Text(
                        _identity!.bio!,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          color: AppColors.greyMedium,
                          height: 1.5,
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 60),

              // Digital Links (Living Elements)
              ..._identity!.links.asMap().entries.map((entry) {
                final index = entry.key;
                final link = entry.value;
                return FadeInUp(
                  delay: Duration(milliseconds: 1000 + (index * 200)),
                  child: _buildLivingElement(link),
                );
              }).toList(),
              
              const SizedBox(height: 80),
              
              // Temporal Status Info
              FadeIn(
                delay: const Duration(seconds: 3),
                child: Text(
                  'CURRENT SPACE: ${status.toUpperCase()}',
                  style: GoogleFonts.outfit(
                    fontSize: 8,
                    letterSpacing: 4,
                    color: AppColors.greyDark,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLivingElement(NexusLink link) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      child: InkWell(
        // CRITICAL: Show QR Code instead of opening URL directly
        onTap: () => _showQRCodeModal(link),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.blackCarbon.withOpacity(0.5),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.blackCharcoal, width: 0.5),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.blackMatte,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.yellowWarm.withOpacity(0.05),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: Icon(_getIconData(link.icon), color: AppColors.yellowWarm, size: 20),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      link.label,
                      style: GoogleFonts.outfit(
                        color: AppColors.whitePure,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'اضغط لعرض QR',
                      style: GoogleFonts.outfit(
                        color: AppColors.yellowWarm.withOpacity(0.7),
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.yellowWarm.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.qr_code, color: AppColors.yellowWarm, size: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Show QR Code Modal - CORE FUNCTIONALITY (NO DIRECT LINK OPENING)
  void _showQRCodeModal(NexusLink link) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        padding: const EdgeInsets.all(32),
        decoration: const BoxDecoration(
          color: AppColors.blackCarbon,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.greyDark,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            
            // Title
            Text(
              link.label,
              style: GoogleFonts.outfit(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: AppColors.whitePure,
              ),
            ),
            const SizedBox(height: 24),
            
            // QR Code Container
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
                data: link.url,
                version: QrVersions.auto,
                size: 200,
                backgroundColor: Colors.white,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Instruction
            Text(
              'امسح الكود باستخدام كاميرا الهاتف',
              style: GoogleFonts.outfit(
                fontSize: 14,
                color: AppColors.greyMedium,
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Color _getTemporalColor(String status) {
    switch (status) {
      case 'dawn': return Colors.purple;
      case 'noon': return Colors.blue;
      case 'dusk': return Colors.orange;
      default: return AppColors.yellowWarm;
    }
  }

  IconData _getIconData(String type) {
    switch (type) {
      case 'bolt': return Icons.bolt;
      case 'link': return Icons.link;
      case 'message': return Icons.message_outlined;
      case 'globe': return Icons.public;
      default: return Icons.star_border;
    }
  }

  Widget _buildErrorState() {
    return Center(
      child: Text(
        'ERR: SPACE REJECTED',
        style: GoogleFonts.outfit(color: Colors.red, letterSpacing: 5),
      ),
    );
  }
}
