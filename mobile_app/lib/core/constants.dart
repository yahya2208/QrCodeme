import 'package:flutter/material.dart';

class AppColors {
  // Black Palette
  static const Color blackVoid = Color(0xFF000000);
  static const Color blackDeep = Color(0xFF0A0A0A);
  static const Color blackCarbon = Color(0xFF0F0F0F);
  static const Color blackMatte = Color(0xFF141414);
  static const Color blackGraphite = Color(0xFF1A1A1A);
  static const Color blackCharcoal = Color(0xFF2A2A2A);

  // Yellow Palette
  static const Color yellowNeon = Color(0xFFFFF000);
  static const Color yellowElectric = Color(0xFFFFE600);
  static const Color yellowBright = Color(0xFFFFD900);
  static const Color yellowWarm = Color(0xFFFFCC00);
  static const Color yellowGold = Color(0xFFFFB800);
  static const Color yellowAmber = Color(0xFFFFA500);
  
  static const Color yellowGlow = Color(0x66FFE600);
  static const Color yellowGhost = Color(0x26FFE600);

  // Greys & Whites
  static const Color whitePure = Color(0xFFFFFFFF);
  static const Color greyLight = Color(0xFF888888);
  static const Color greyMedium = Color(0xFF666666);
  static const Color greyDark = Color(0xFF444444);
}

class AppConfig {
  static const String appName = 'Qr Id';
  
  // Update this to your local IP for physical device testing
  // Use http://10.0.2.2:3001 for Android Emulator
  static const String baseUrl = 'http://10.0.2.2:3001/api'; 
}
