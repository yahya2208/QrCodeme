import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../core/constants.dart';
import 'home_page.dart';
import 'discover_page.dart';
import 'scan_page.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  static _MainScreenState? of(BuildContext context) =>
      context.findAncestorStateOfType<_MainScreenState>();

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  bool _isLoading = true;

  void setTab(int index) {
    setState(() => _currentIndex = index);
  }

  final List<Widget> _pages = [
    const HomePage(),
    const DiscoverPage(),
    const ScanPage(),
  ];

  @override
  void initState() {
    super.initState();
    _startAnimation();
  }

  void _startAnimation() async {
    await Future.delayed(const Duration(milliseconds: 2500));
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return _buildLoader();
    }

    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.blackCharcoal, width: 0.5)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: AppColors.blackDeep,
          selectedItemColor: AppColors.yellowWarm,
          unselectedItemColor: AppColors.greyMedium,
          showSelectedLabels: false,
          showUnselectedLabels: false,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home, color: AppColors.yellowWarm),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.search),
              activeIcon: Icon(Icons.search, color: AppColors.yellowWarm),
              label: 'Discover',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.qr_code_scanner_outlined),
              activeIcon: Icon(Icons.qr_code_scanner, color: AppColors.yellowWarm),
              label: 'Scan',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoader() {
    return Scaffold(
      backgroundColor: AppColors.blackVoid,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FadeInDown(
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const RadialGradient(
                    colors: [AppColors.yellowNeon, Colors.transparent],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.yellowWarm.withOpacity(0.5),
                      blurRadius: 30,
                      spreadRadius: 10,
                    ),
                  ],
                ),
                child: const Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.yellowWarm),
                    strokeWidth: 2,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 48),
            FadeInUp(
              delay: const Duration(milliseconds: 500),
              child: Text(
                'Qr Id',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  letterSpacing: 8,
                  fontWeight: FontWeight.w900,
                  color: AppColors.yellowWarm,
                ),
              ),
            ),
            const SizedBox(height: 8),
            FadeIn(
              delay: const Duration(milliseconds: 1000),
              child: const Text(
                'منصة الاكتشاف الذكية',
                style: TextStyle(
                  color: AppColors.greyMedium,
                  letterSpacing: 4,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
