class Shop {
  final String id;
  final String name;
  final String link;
  final String categoryId;
  final String? description;
  final int scans;
  final int views;
  final DateTime createdAt;

  Shop({
    required this.id,
    required this.name,
    required this.link,
    required this.categoryId,
    this.description,
    required this.scans,
    required this.views,
    required this.createdAt,
  });

  factory Shop.fromJson(Map<String, dynamic> json) {
    return Shop(
      id: json['id'],
      name: json['name'],
      link: json['link'],
      categoryId: json['category_id'] ?? json['category']?['id'] ?? 'other',
      description: json['description'],
      scans: json['scans'] ?? 0,
      views: json['views'] ?? 0,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class Category {
  final String id;
  final String nameAr;
  final String nameEn;
  final String icon;

  Category({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    required this.icon,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      nameAr: json['name_ar'],
      nameEn: json['name_en'],
      icon: json['icon'],
    );
  }
}

class GlobalStats {
  final int totalShops;
  final int totalQRCodes;
  final int totalScans;
  final int totalViews;
  final int totalCategories;

  GlobalStats({
    required this.totalShops,
    required this.totalQRCodes,
    required this.totalScans,
    required this.totalViews,
    required this.totalCategories,
  });

  factory GlobalStats.fromJson(Map<String, dynamic> json) {
    return GlobalStats(
      totalShops: json['totalShops'] ?? 0,
      totalQRCodes: json['totalQRCodes'] ?? 0,
      totalScans: json['totalScans'] ?? 0,
      totalViews: json['totalViews'] ?? 0,
      totalCategories: json['totalCategories'] ?? 0,
    );
  }
}

class NexusIdentity {
  final String id;
  final String displayName;
  final String? professionId;
  final String? bio;
  final Map<String, dynamic> themeConfig;
  final double pulse;
  final String temporalStatus;
  final List<NexusLink> links;

  NexusIdentity({
    required this.id,
    required this.displayName,
    this.professionId,
    this.bio,
    required this.themeConfig,
    required this.pulse,
    required this.temporalStatus,
    required this.links,
  });

  factory NexusIdentity.fromJson(Map<String, dynamic> json) {
    return NexusIdentity(
      id: json['id'],
      displayName: json['display_name'],
      professionId: json['profession_id'],
      bio: json['bio'],
      themeConfig: json['theme_config'] ?? {},
      pulse: (json['pulse'] ?? 1.0).toDouble(),
      temporalStatus: json['temporal_status'] ?? 'void',
      links: (json['links'] as List? ?? [])
          .map((l) => NexusLink.fromJson(l))
          .toList(),
    );
  }
}

class NexusLink {
  final String label;
  final String url;
  final String type;
  final String icon;

  NexusLink({
    required this.label,
    required this.url,
    required this.type,
    required this.icon,
  });

  factory NexusLink.fromJson(Map<String, dynamic> json) {
    return NexusLink(
      label: json['label'],
      url: json['target_url'],
      type: json['link_type'] ?? 'external',
      icon: json['icon_type'] ?? 'bolt',
    );
  }
}

