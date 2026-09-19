import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/quote.dart';
import '../services/api_service.dart';
import '../widgets/signature_pad.dart';

class CreateQuoteScreen extends StatefulWidget {
  const CreateQuoteScreen({super.key});

  @override
  State<CreateQuoteScreen> createState() => _CreateQuoteScreenState();
}

class _CreateQuoteScreenState extends State<CreateQuoteScreen> {
  final _formKey = GlobalKey<FormState>();

  final _docController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _contactController = TextEditingController();

  final _plateController = TextEditingController();
  final _vinController = TextEditingController();
  final _modelController = TextEditingController();

  final _validUntilController = TextEditingController(text: '15 días calendario');
  final _deliveryTermController = TextEditingController(text: 'Inmediato / Según programación');

  bool _isLoading = false;
  bool _isSearchingDoc = false;
  List<CatalogItem> _catalog = [];
  final List<QuoteItem> _items = [];

  @override
  void initState() {
    super.initState();
    _loadCatalog();
    _items.add(QuoteItem(
      code: 'MO01',
      description: 'INSTALACIÓN DE RELÉ DE ARRANQUE',
      quantity: 1,
      unitPrice: 50.0,
      value: 50.0,
    ));
  }

  @override
  void dispose() {
    _docController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _contactController.dispose();
    _plateController.dispose();
    _vinController.dispose();
    _modelController.dispose();
    _validUntilController.dispose();
    _deliveryTermController.dispose();
    super.dispose();
  }

  Future<void> _loadCatalog() async {
    final list = await ApiService.getCatalog();
    if (!mounted) return;
    setState(() {
      _catalog = list.isNotEmpty ? list : ApiService.fallbackCatalog;
    });
  }

  void _openCatalogPicker() {
    final catalogToShow = _catalog.isNotEmpty ? _catalog : ApiService.fallbackCatalog;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.4,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, scrollController) => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(color: Colors.grey.shade700, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.build_circle, color: Color(0xFFF59E0B)),
                      SizedBox(width: 8),
                      Text('Catálogo de Mano de Obra', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white70),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Text('Toca un servicio para agregarlo a la cotización actual:', style: TextStyle(color: Colors.grey, fontSize: 12)),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  itemCount: catalogToShow.length,
                  itemBuilder: (_, i) {
                    final item = catalogToShow[i];
                    return Card(
                      color: const Color(0xFF1E293B),
                      margin: const EdgeInsets.only(bottom: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: ListTile(
                        leading: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF080A0F), borderRadius: BorderRadius.circular(6)),
                          child: Text(item.code, style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                        title: Text(item.description, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12)),
                        subtitle: Text('S/ ${item.defaultPrice.toStringAsFixed(2)}', style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 12)),
                        trailing: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF59E0B),
                            foregroundColor: const Color(0xFF0F172A),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          ),
                          onPressed: () {
                            _addCatalogItem(item);
                            Navigator.pop(ctx);
                          },
                          child: const Text('Agregar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _searchDoc() async {
    final clean = _docController.text.trim();
    if (clean.length != 8 && clean.length != 11) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa un DNI (8 dígitos) o RUC (11 dígitos)')),
      );
      return;
    }

    setState(() => _isSearchingDoc = true);
    try {
      if (clean.length == 11) {
        final data = await ApiService.lookupRuc(clean);
        if (data != null && mounted) {
          setState(() {
            _nameController.text = data['razonSocial'] ?? '';
            _addressController.text = data['direccion'] ?? '';
            if (_contactController.text.isEmpty) {
              _contactController.text = data['razonSocial'] ?? '';
            }
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Datos de SUNAT completados')),
          );
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('No se encontró información para este RUC')),
            );
          }
        }
      } else {
        final data = await ApiService.lookupDni(clean);
        if (data != null && mounted) {
          final fullName = data['nombreCompleto'] ??
              '${data['nombres'] ?? ''} ${data['apellidoPaterno'] ?? ''} ${data['apellidoMaterno'] ?? ''}'.trim();
          setState(() {
            _nameController.text = fullName;
            if (_contactController.text.isEmpty) {
              _contactController.text = fullName;
            }
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Datos de RENIEC completados')),
          );
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('No se encontró información para este DNI')),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error en consulta: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSearchingDoc = false);
    }
  }

  void _addCatalogItem(CatalogItem item) {
    setState(() {
      _items.add(QuoteItem(
        code: item.code,
        description: item.description,
        quantity: 1,
        unitPrice: item.defaultPrice,
        value: item.defaultPrice,
      ));
    });
  }

  void _removeItem(int index) {
    setState(() {
      _items.removeAt(index);
    });
  }

  double get _total => _items.fold(0.0, (sum, i) => sum + (i.quantity * i.unitPrice));

  Future<void> _submitQuote() async {
    if (!_formKey.currentState!.validate()) return;
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Agrega al menos un ítem o servicio')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final payload = {
      'templateType': 'TALLER_DETALLADO',
      'clientDoc': _docController.text.trim(),
      'clientName': _nameController.text.trim(),
      'clientPhone': _phoneController.text.trim(),
      'clientAddress': _addressController.text.trim(),
      'referencePerson': _contactController.text.trim().isNotEmpty
          ? _contactController.text.trim()
          : _nameController.text.trim(),
      'validUntil': _validUntilController.text.trim().isNotEmpty
          ? _validUntilController.text.trim()
          : '15 días calendario',
      'deliveryTerm': _deliveryTermController.text.trim().isNotEmpty
          ? _deliveryTermController.text.trim()
          : 'Inmediato / Según programación',
      'plate': _plateController.text.trim().toUpperCase(),
      'vin': _vinController.text.trim(),
      'model': _modelController.text.trim(),
      'advisorName': 'Ruben Basil (Móvil)',
      'items': _items.map((i) => i.toJson()).toList(),
    };

    final result = await ApiService.createQuote(payload);
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result['success'] == true) {
      final quote = result['data'];
      final whatsapp = result['whatsapp'];
      _showSuccessDialog(quote, whatsapp);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${result['message']}')),
      );
    }
  }

  void _showSuccessDialog(dynamic quote, dynamic whatsapp) {
    final currencyFormat = NumberFormat.currency(locale: 'es_PE', symbol: 'S/ ');
    final totalStr = currencyFormat.format(quote['total'] ?? 0);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 28),
            SizedBox(width: 8),
            Text('¡Cotización Emitida!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('N°: ${quote['quoteNumber']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 4),
            Text('Cliente: ${quote['clientName']}'),
            Text('Vehículo: ${quote['plate']} (${quote['model']})'),
            const SizedBox(height: 8),
            Text('Total: $totalStr', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF0F294A), fontSize: 18)),
            const SizedBox(height: 12),
            const Text('PDF oficial generado y listo para enviar al cliente.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context, true);
            },
            child: const Text('Volver al Inicio'),
          ),
          if (whatsapp != null && whatsapp['whatsappUrl'] != null)
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF25D366),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () async {
                final url = Uri.parse(whatsapp['whatsappUrl']);
                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                }
              },
              icon: const Icon(Icons.share, size: 18),
              label: const Text('Enviar WhatsApp'),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'es_PE', symbol: 'S/ ');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Nueva Cotización en Campo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        backgroundColor: const Color(0xFF0F294A),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Color(0xFFF59E0B)),
                  SizedBox(height: 16),
                  Text('Generando cotización y maquetando PDF oficial...'),
                ],
              ),
            )
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildSectionHeader('1. Información del Cliente', Icons.business),
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _docController,
                                  decoration: const InputDecoration(
                                    labelText: 'RUC o DNI',
                                    hintText: 'Ej. 20608765432 ó 72409984',
                                    isDense: true,
                                  ),
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton(
                                onPressed: _isSearchingDoc ? null : _searchDoc,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0F294A),
                                  foregroundColor: Colors.white,
                                ),
                                child: _isSearchingDoc
                                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                    : const Text('BUSCAR'),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _nameController,
                            decoration: const InputDecoration(labelText: 'Razón Social / Nombre', isDense: true),
                            validator: (v) => v!.isEmpty ? 'Requerido' : null,
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _contactController,
                            decoration: const InputDecoration(labelText: 'Contacto / Referencia', hintText: 'Ing. Supervisor / Propietario', isDense: true),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _phoneController,
                            decoration: const InputDecoration(labelText: 'Teléfono WhatsApp', hintText: '970830502', isDense: true),
                            keyboardType: TextInputType.phone,
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _addressController,
                            decoration: const InputDecoration(labelText: 'Dirección', isDense: true),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  _buildSectionHeader('2. Vehículo / Maquinaria', Icons.directions_car),
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _plateController,
                                  decoration: const InputDecoration(labelText: 'Placa / Matrícula', hintText: 'ABG890', isDense: true),
                                  textCapitalization: TextCapitalization.characters,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextFormField(
                                  controller: _vinController,
                                  decoration: const InputDecoration(labelText: 'VIN / Chasis / Unidad', hintText: 'unidad 1056', isDense: true),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _modelController,
                            decoration: const InputDecoration(labelText: 'Modelo', hintText: 'Camc Mixer / Bus 12m', isDense: true),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  _buildSectionHeader('3. Condiciones y Plazos de Entrega', Icons.schedule),
                  Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _deliveryTermController,
                            decoration: const InputDecoration(labelText: 'Plazo de Entrega', hintText: 'Inmediato / Según programación', isDense: true),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _validUntilController,
                            decoration: const InputDecoration(labelText: 'Validez de la Oferta', hintText: '15 días calendario', isDense: true),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildSectionHeader('4. Servicios (Mano de Obra)', Icons.build),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF59E0B),
                          foregroundColor: const Color(0xFF0F172A),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        ),
                        onPressed: _openCatalogPicker,
                        icon: const Icon(Icons.menu_book, size: 16),
                        label: const Text('Catálogo MO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),

                  for (var i = 0; i < _items.length; i++)
                    Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(color: const Color(0xFF0F294A), borderRadius: BorderRadius.circular(6)),
                                  child: Text(_items[i].code, style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 11)),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(_items[i].description, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                  onPressed: () => _removeItem(i),
                                ),
                              ],
                            ),
                            const Divider(),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    const Text('Cant: ', style: TextStyle(fontSize: 12)),
                                    IconButton(
                                      icon: const Icon(Icons.remove_circle_outline, size: 18),
                                      onPressed: _items[i].quantity > 1 ? () => setState(() => _items[i].quantity--) : null,
                                    ),
                                    Text('${_items[i].quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                    IconButton(
                                      icon: const Icon(Icons.add_circle_outline, size: 18),
                                      onPressed: () => setState(() => _items[i].quantity++),
                                    ),
                                  ],
                                ),
                                Text(
                                  'Subtotal: ${currencyFormat.format(_items[i].quantity * _items[i].unitPrice)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F294A)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                  const SizedBox(height: 8),

                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F294A),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('TOTAL GENERAL (S/):', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        Text(
                          currencyFormat.format(_total),
                          style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.w900, fontSize: 18),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  SignaturePadWidget(
                    onSignatureChanged: (points) {},
                    onClear: () {},
                  ),

                  const SizedBox(height: 24),

                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF59E0B),
                      foregroundColor: const Color(0xFF0F294A),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _submitQuote,
                    icon: const Icon(Icons.picture_as_pdf),
                    label: const Text('EMITIR COTIZACIÓN & GENERAR PDF', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFFF59E0B)),
          const SizedBox(width: 6),
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F294A), fontSize: 13)),
        ],
      ),
    );
  }
}
