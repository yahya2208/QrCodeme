import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants.dart';
import '../models/models.dart';

class ApiService {
  final String _baseUrl = AppConfig.baseUrl;

  // Generic GET request
  Future<Map<String, dynamic>> _get(String endpoint) async {
    final response = await http.get(Uri.parse('$_baseUrl$endpoint'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load data: ${response.statusCode}');
    }
  }

  // Generic POST request
  Future<Map<String, dynamic>> _post(String endpoint, Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$_baseUrl$endpoint'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to post data: ${response.statusCode}');
    }
  }

  // Get Global Stats
  Future<GlobalStats> getGlobalStats() async {
    final result = await _get('/analytics/stats');
    return GlobalStats.fromJson(result['data']);
  }

  // Get Categories
  Future<List<Category>> getCategories() async {
    final result = await _get('/analytics/categories');
    final List data = result['data'];
    return data.map((json) => Category.fromJson(json)).toList();
  }

  // Get Shops
  Future<List<Shop>> getShops({String category = 'all'}) async {
    final endpoint = category == 'all' ? '/shops' : '/shops?category=$category';
    final result = await _get(endpoint);
    final List data = result['data'];
    return data.map((json) => Shop.fromJson(json)).toList();
  }

  // Search Shops
  Future<List<Shop>> searchShops(String query) async {
    final result = await _get('/shops/search?q=$query');
    final List data = result['data'];
    return data.map((json) => Shop.fromJson(json)).toList();
  }

  // Create Shop
  Future<Shop> createShop(String name, String link, String category) async {
    final result = await _post('/qr/generate', {
      'name': name,
      'link': link,
      'category': category,
    });
    return Shop.fromJson(result['data']['shop']);
  }

  // Record View
  Future<void> recordView(String shopId) async {
    await _post('/shops/$shopId/view', {'source': 'mobile'});
  }

  // Record Scan
  Future<void> recordScan(String shopId) async {
    await _post('/shops/$shopId/scan', {'source': 'mobile'});
  }
  
  // Resolve QR
  Future<Shop?> resolveQR(String id) async {
    try {
      final result = await _get('/qr/resolve/$id');
      if (result['success'] == true && result['isInternal'] == true) {
        return Shop.fromJson(result['data']);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // NEXUS ID: Get Identity
  Future<NexusIdentity> getNexusIdentity(String id) async {
    final result = await _get('/nexus/$id');
    return NexusIdentity.fromJson(result['data']);
  }

  // NEXUS ID: Create Identity
  Future<Map<String, dynamic>> createNexusIdentity(String displayName, {String? profession, String? bio, List<Map<String, dynamic>>? links}) async {
    final result = await _post('/nexus/create', {
      'displayName': displayName,
      'profession': profession,
      'bio': bio,
      'links': links,
    });
    return result['data'];
  }

  // NEXUS ID: Update Identity
  Future<void> updateNexusIdentity(String id, String displayName, {String? bio, List<Map<String, dynamic>>? links}) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/nexus/$id'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'displayName': displayName,
        'bio': bio,
        'links': links,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update identity: ${response.statusCode}');
    }
  }

  // REFERRAL & POINTS
  Future<Map<String, dynamic>> getUserPoints(String userId) async {
    final result = await _get('/referral/points/$userId');
    return result['data'];
  }

  Future<Map<String, dynamic>> awardSharePoints(String userId, String channel) async {
    final result = await _post('/referral/share', {
      'userId': userId,
      'channel': channel,
    });
    return result['data'];
  }
}

