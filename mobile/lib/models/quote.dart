class CatalogItem {
  final String id;
  final String code;
  final String description;
  final String category;
  final double defaultPrice;

  CatalogItem({
    this.id = '',
    required this.code,
    required this.description,
    this.category = 'MANO_OBRA',
    required this.defaultPrice,
  });

  factory CatalogItem.fromJson(Map<String, dynamic> json) {
    return CatalogItem(
      id: json['_id'] ?? '',
      code: json['code'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'MANO_OBRA',
      defaultPrice: (json['defaultPrice'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class QuoteItem {
  String code;
  String description;
  int quantity;
  double unitPrice;
  double value;

  QuoteItem({
    required this.code,
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.value,
  });

  Map<String, dynamic> toJson() => {
    'code': code,
    'description': description,
    'quantity': quantity,
    'unitPrice': unitPrice,
    'value': value,
  };

  factory QuoteItem.fromJson(Map<String, dynamic> json) {
    return QuoteItem(
      code: json['code'] ?? '',
      description: json['description'] ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      value: (json['value'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class Quote {
  final String id;
  final String quoteNumber;
  final String templateType;
  final String status;
  final String clientName;
  final String clientDoc;
  final String clientAddress;
  final String clientPhone;
  final String plate;
  final String vin;
  final String model;
  final double total;
  final List<QuoteItem> items;
  final String? clientSignature;
  final String? pdfUrl;

  Quote({
    required this.id,
    required this.quoteNumber,
    required this.templateType,
    required this.status,
    required this.clientName,
    required this.clientDoc,
    required this.clientAddress,
    required this.clientPhone,
    required this.plate,
    required this.vin,
    required this.model,
    required this.total,
    required this.items,
    this.clientSignature,
    this.pdfUrl,
  });

  factory Quote.fromJson(Map<String, dynamic> json) {
    var rawItems = json['items'] as List? ?? [];
    List<QuoteItem> parsedItems = rawItems.map((i) => QuoteItem.fromJson(i)).toList();

    return Quote(
      id: json['_id'] ?? '',
      quoteNumber: json['quoteNumber'] ?? '',
      templateType: json['templateType'] ?? 'TALLER_DETALLADO',
      status: json['status'] ?? 'BORRADOR',
      clientName: json['clientName'] ?? '',
      clientDoc: json['clientDoc'] ?? '',
      clientAddress: json['clientAddress'] ?? '',
      clientPhone: json['clientPhone'] ?? '',
      plate: json['plate'] ?? '',
      vin: json['vin'] ?? '',
      model: json['model'] ?? '',
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      items: parsedItems,
      clientSignature: json['clientSignature'],
      pdfUrl: json['pdfUrl'],
    );
  }
}
