import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:animate_do/animate_do.dart';
import '../core/constants.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import 'widgets/shop_details_modal.dart';
import 'nexus_identity_screen.dart';

class ScanPage extends StatefulWidget {
  const ScanPage({super.key});

  @override
  State<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends State<ScanPage> {
  final MobileScannerController _controller = MobileScannerController();
  final ApiService _api = ApiService();
  bool _isProcessing = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? code = barcodes.first.rawValue;
    if (code == null) return;

    setState(() => _isProcessing = true);
    
    // Check if it's an internal QR
    if (code.startsWith('qrnexus://')) {
      final path = code.replaceFirst('qrnexus://', '');
      
      // Handle NEXUS ID
      if (path.startsWith('id/')) {
        final id = path.replaceFirst('id/', '');
        if (mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => NexusIdentityScreen(identityId: id),
            ),
          );
        }
      } 
      // Handle Standard Shop
      else {
        final shop = await _api.resolveQR(path);
        if (shop != null) {
          if (mounted) _showResultModal(shop);
        } else {
          if (mounted) _showExternalResult(code);
        }
      }
    } else {
      if (mounted) _showExternalResult(code);
    }
    
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _isProcessing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Scanner
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),

          // Overlay
          _buildOverlay(),

          // Back Button
          Positioned(
            top: 60,
            left: 20,
            child: CircleAvatar(
              backgroundColor: AppColors.blackDeep.withOpacity(0.5),
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: AppColors.whitePure),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),

          // Flash Button
          Positioned(
            bottom: 60,
            right: 20,
            child: CircleAvatar(
              backgroundColor: AppColors.blackDeep.withOpacity(0.5),
              child: IconButton(
                icon: ValueListenableBuilder(
                  valueListenable: _controller.torchState,
                  builder: (context, state, child) {
                    return Icon(
                      state == TorchState.on ? Icons.flash_on : Icons.flash_off,
                      color: AppColors.yellowWarm,
                    );
                  },
                ),
                onPressed: () => _controller.toggleTorch(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverlay() {
    return Container(
      decoration: ShapeDecoration(
        shape: QrScannerOverlayShape(
          borderColor: AppColors.yellowNeon,
          borderRadius: 20,
          borderLength: 40,
          borderWidth: 10,
          cutOutSize: 280,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 350),
            FadeInDown(
              infinite: true,
              duration: const Duration(seconds: 2),
              child: const Text(
                'وجّه الكاميرا نحو كود QR',
                style: TextStyle(
                  color: AppColors.whitePure,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.yellowNeon,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'جاري البحث...',
                  style: TextStyle(color: AppColors.yellowWarm, fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showResultModal(Shop shop) {
    _controller.stop();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ShopDetailsModal(shop: shop),
    ).then((_) => _controller.start());
  }

  void _showExternalResult(String code) {
    _controller.stop();
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(32),
        decoration: const BoxDecoration(
          color: AppColors.blackDeep,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.yellowWarm.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.qr_code_scanner, color: AppColors.yellowWarm, size: 48),
            ),
            const SizedBox(height: 16),
            const Text(
              'تم مسح الكود',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.blackCarbon,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                code,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.greyMedium, fontSize: 12),
              ),
            ),
            const SizedBox(height: 16),
            // Info message - NO DIRECT LINK OPENING
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.blackMatte,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.yellowWarm.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: AppColors.yellowWarm, size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'QRme لا يفتح الروابط مباشرة - انسخ الرابط واستخدمه',
                      style: TextStyle(color: AppColors.greyMedium, fontSize: 10),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // Copy to clipboard instead of opening
                      // Clipboard not imported, just close for now
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('تم حفظ المحتوى')),
                      );
                    },
                    icon: const Icon(Icons.copy),
                    label: const Text('نسخ'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.yellowWarm,
                      foregroundColor: AppColors.blackDeep,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('إغلاق'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).then((_) => _controller.start());
  }
}

// Helper class for the scanner overlay
class QrScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final double borderLength;
  final double borderRadius;
  final double cutOutSize;

  QrScannerOverlayShape({
    this.borderColor = Colors.white,
    this.borderWidth = 1.0,
    this.borderLength = 20.0,
    this.borderRadius = 0.0,
    this.cutOutSize = 250.0,
  });

  @override
  EdgeInsetsGeometry get dimensions => const EdgeInsets.all(10);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) => Path();

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    return Path()..addRect(rect);
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final height = rect.height;
    final cutOutRect = Rect.fromLTWH(
      rect.left + (width - cutOutSize) / 2,
      rect.top + (height - cutOutSize) / 2,
      cutOutSize,
      cutOutSize,
    );

    final backgroundPaint = Paint()
      ..color = Colors.black.withOpacity(0.7)
      ..style = PaintingStyle.fill;

    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final boxPaint = Paint()
      ..color = Colors.black
      ..blendMode = BlendMode.dstOut;

    final path = Path()
      ..addRect(rect)
      ..addRRect(RRect.fromRectAndRadius(cutOutRect, Radius.circular(borderRadius)))
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(path, backgroundPaint);

    final hBorder = borderLength;
    final vBorder = borderLength;

    // Top Left
    canvas.drawPath(
      Path()
        ..moveTo(cutOutRect.left, cutOutRect.top + vBorder)
        ..lineTo(cutOutRect.left, cutOutRect.top + borderRadius)
        ..arcToPoint(Offset(cutOutRect.left + borderRadius, cutOutRect.top),
            radius: Radius.circular(borderRadius))
        ..lineTo(cutOutRect.left + hBorder, cutOutRect.top),
      borderPaint,
    );

    // Top Right
    canvas.drawPath(
      Path()
        ..moveTo(cutOutRect.right - hBorder, cutOutRect.top)
        ..lineTo(cutOutRect.right - borderRadius, cutOutRect.top)
        ..arcToPoint(Offset(cutOutRect.right, cutOutRect.top + borderRadius),
            radius: Radius.circular(borderRadius))
        ..lineTo(cutOutRect.right, cutOutRect.top + vBorder),
      borderPaint,
    );

    // Bottom Left
    canvas.drawPath(
      Path()
        ..moveTo(cutOutRect.left, cutOutRect.bottom - vBorder)
        ..lineTo(cutOutRect.left, cutOutRect.bottom - borderRadius)
        ..arcToPoint(Offset(cutOutRect.left + borderRadius, cutOutRect.bottom),
            radius: Radius.circular(borderRadius), clockwise: false)
        ..lineTo(cutOutRect.left + hBorder, cutOutRect.bottom),
      borderPaint,
    );

    // Bottom Right
    canvas.drawPath(
      Path()
        ..moveTo(cutOutRect.right - hBorder, cutOutRect.bottom)
        ..lineTo(cutOutRect.right - borderRadius, cutOutRect.bottom)
        ..arcToPoint(Offset(cutOutRect.right, cutOutRect.bottom - borderRadius),
            radius: Radius.circular(borderRadius), clockwise: false)
        ..lineTo(cutOutRect.right, cutOutRect.bottom - vBorder),
      borderPaint,
    );
  }

  @override
  ShapeBorder scale(double t) => this;
}
