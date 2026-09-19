import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const DarsilApp());
}

class DarsilApp extends StatelessWidget {
  const DarsilApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DARSIL Automotive Solutions',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFF0F294A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F294A),
          primary: const Color(0xFF0F294A),
          secondary: const Color(0xFFF59E0B),
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F294A),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
