import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/quote.dart';

class ApiService {
  // IP por defecto del host de desarrollo en red local (Wi-Fi)
  static String currentHost = '192.168.1.21';
  static int currentPort = 4000;

  static String get baseUrl => 'http://$currentHost:$currentPort/api';

  static void setCustomHost(String host, {int port = 4000}) {
    currentHost = host.trim();
    currentPort = port;
  }

  // Catálogo Maestro Offline de Respaldo (Garantiza que Catálogo MO NUNCA esté vacío)
  static final List<CatalogItem> fallbackCatalog = [
    CatalogItem(code: 'MO01', description: 'INSTALACIÓN DE RELÉ DE ARRANQUE', defaultPrice: 50.0),
    CatalogItem(code: 'MO02', description: 'DIAGNÓSTICO ELECTRÓNICO CON SCANNER DE FLOTA', defaultPrice: 120.0),
    CatalogItem(code: 'MO03', description: 'MANTENIMIENTO DE ALTERNADOR DE 24V', defaultPrice: 180.0),
    CatalogItem(code: 'MO04', description: 'REPARACIÓN DE MOTOR DE ARRANQUE PESADO', defaultPrice: 200.0),
    CatalogItem(code: 'MO05', description: 'FABRICACIÓN Y ADAPTACIÓN DE PIEZA EN IMPRESIÓN 3D', defaultPrice: 150.0),
    CatalogItem(code: 'MO06', description: 'CORRECCIÓN DE CABLEADO Y FUSIBLERA PRINCIPAL', defaultPrice: 140.0),
    CatalogItem(code: 'MO07', description: 'INSTALACIÓN DE FAROS LED AUXILIARES Y NEBLINEROS', defaultPrice: 90.0),
    CatalogItem(code: 'MO08', description: 'SERVICIO TÉCNICO DE ASISTENCIA EN TERRENO', defaultPrice: 160.0),
    CatalogItem(code: 'MO09', description: 'PURGA Y CALIBRACIÓN DE SISTEMA DE INYECCIÓN', defaultPrice: 110.0),
    CatalogItem(code: 'MO10', description: 'REVISIÓN DE COMPUTADORA ECU Y LÍNEA CAN BUS', defaultPrice: 220.0),
    CatalogItem(code: 'MO11', description: 'REPARACIÓN DE CORTOCIRCUITO EN RAMAL POSTERIOR', defaultPrice: 130.0),
    CatalogItem(code: 'MO12', description: 'CALIBRACIÓN DE SENSORES Y ACTUADORES DE MOTOR', defaultPrice: 95.0),
  ];

  static Future<bool> testConnection(String host) async {
    try {
      final res = await http.get(Uri.parse('http://$host:$currentPort/api/company')).timeout(const Duration(seconds: 3));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<List<Quote>> getQuotes() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/quotes')).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final list = data['data'] as List;
        return list.map((q) => Quote.fromJson(q)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error al obtener cotizaciones ($baseUrl): $e');
      return [];
    }
  }

  static Future<List<CatalogItem>> getCatalog() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/catalog')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final list = data['data'] as List;
        if (list.isNotEmpty) {
          return list.map((c) => CatalogItem.fromJson(c)).toList();
        }
      }
      return fallbackCatalog;
    } catch (e) {
      debugPrint('Usando catálogo local offline: $e');
      return fallbackCatalog;
    }
  }

  static Future<Map<String, dynamic>?> lookupRuc(String ruc) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/integrations/ruc/$ruc')).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      debugPrint('Error lookup RUC: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>?> lookupDni(String dni) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/integrations/dni/$dni')).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      debugPrint('Error lookup DNI: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>> createQuote(Map<String, dynamic> payload) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/quotes'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(payload),
      ).timeout(const Duration(seconds: 15));
      return json.decode(res.body);
    } catch (e) {
      return {'success': false, 'message': 'Error de conexión con $baseUrl: $e'};
    }
  }

  static String getPdfUrl(String quoteId) {
    return '$baseUrl/quotes/$quoteId/pdf';
  }
}
