import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'constants.dart';

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.blackDeep,
      primaryColor: AppColors.yellowWarm,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.yellowWarm,
        secondary: AppColors.yellowNeon,
        surface: AppColors.blackCarbon,
        background: AppColors.blackDeep,
      ),
      textTheme: GoogleFonts.outfitTextTheme(
        const TextTheme(
          displayLarge: TextStyle(color: AppColors.whitePure, fontWeight: FontWeight.bold),
          displayMedium: TextStyle(color: AppColors.whitePure, fontWeight: FontWeight.bold),
          bodyLarge: TextStyle(color: AppColors.whitePure),
          bodyMedium: TextStyle(color: AppColors.greyLight),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.yellowWarm,
          foregroundColor: AppColors.blackVoid,
          textStyle: const TextStyle(fontWeight: FontWeight.bold),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.blackMatte,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.blackCharcoal),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.blackCharcoal),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.yellowGlow),
        ),
        hintStyle: const TextStyle(color: AppColors.greyDark),
      ),
    );
  }
}
