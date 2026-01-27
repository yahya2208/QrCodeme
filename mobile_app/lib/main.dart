import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/theme.dart';
import 'screens/main_screen.dart';

void main() {
  runApp(const QRNexusApp());
}

class QRNexusApp extends StatelessWidget {
  const QRNexusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Qr Id',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      locale: const Locale('ar', 'SA'),
      supportedLocales: const [
        Locale('ar', 'SA'),
        Locale('en', 'US'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const MainScreen(),
    );
  }
}
