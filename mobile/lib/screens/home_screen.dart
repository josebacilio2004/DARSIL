import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/quote.dart';
import '../services/api_service.dart';
import 'create_quote_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Quote> _quotes = [];
  bool _isLoading = true;
  bool _isConnected = false;

  @override
  void initState() {
    super.initState();
    _loadQuotes();
  }

  Future<void> _loadQuotes() async {
    setState(() => _isLoading = true);
    final connected = await ApiService.testConnection(ApiService.currentHost);
    final list = await ApiService.getQuotes();
    if (!mounted) return;
    setState(() {
      _isConnected = connected;
      _quotes = list;
      _isLoading = false;
    });
  }

  void _openPdf(String quoteId) async {
    final url = Uri.parse(ApiService.getPdfUrl(quoteId));
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _shareWhatsApp(Quote q) async {
    final currencyFormat = NumberFormat.currency(locale: 'es_PE', symbol: 'S/ ');
    final totalStr = currencyFormat.format(q.total);
    final msg = 'Hola ${q.clientName}, le compartimos la cotización ${q.quoteNumber} de DARSIL Automotive Solutions por un total de $totalStr.\nPuede descargar su cotización aquí: ${ApiService.getPdfUrl(q.id)}';
    final url = Uri.parse('https://api.whatsapp.com/send?phone=51${q.clientPhone}&text=${Uri.encodeComponent(msg)}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _showServerConfigDialog() {
    final controller = TextEditingController(text: ApiService.currentHost);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.dns, color: Color(0xFFF59E0B)),
            SizedBox(width: 8),
            Text('Conexión del Servidor', style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Configura la IP de tu PC o servidor Docker (puerto 4000):',
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Host / IP',
                labelStyle: const TextStyle(color: Colors.amber),
                hintText: '192.168.1.21',
                hintStyle: const TextStyle(color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              children: [
                ActionChip(
                  label: const Text('192.168.1.21 (Wi-Fi PC)', style: TextStyle(fontSize: 10)),
                  onPressed: () => controller.text = '192.168.1.21',
                ),
                ActionChip(
                  label: const Text('10.0.2.2 (Emulador)', style: TextStyle(fontSize: 10)),
                  onPressed: () => controller.text = '10.0.2.2',
                ),
                ActionChip(
                  label: const Text('localhost', style: TextStyle(fontSize: 10)),
                  onPressed: () => controller.text = 'localhost',
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFF59E0B),
              foregroundColor: const Color(0xFF0F172A),
            ),
            onPressed: () async {
              ApiService.setCustomHost(controller.text);
              Navigator.pop(ctx);
              _loadQuotes();
            },
            child: const Text('Guardar y Probar'),
          ),
        ],
      ),
    );
  }

  void _showCatalogDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.build_circle, color: Color(0xFFF59E0B)),
                SizedBox(width: 8),
                Text('Catálogo de Mano de Obra & Servicios', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                itemCount: ApiService.fallbackCatalog.length,
                itemBuilder: (ctx, i) {
                  final item = ApiService.fallbackCatalog[i];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.code, style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 11)),
                              Text(item.description, style: const TextStyle(color: Colors.white, fontSize: 12)),
                            ],
                          ),
                        ),
                        Text('S/ ${item.defaultPrice.toStringAsFixed(2)}', style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'es_PE', symbol: 'S/ ');
    final totalCotizado = _quotes.fold(0.0, (sum, q) => sum + q.total);

    return Scaffold(
      backgroundColor: const Color(0xFF080A0F),
      drawer: Drawer(
        backgroundColor: const Color(0xFF0F172A),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                color: Color(0xFF080A0F),
                border: Border(bottom: BorderSide(color: Color(0xFF1E293B))),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/logo_transparente.png',
                    height: 48,
                    errorBuilder: (ctx, err, stack) => const Icon(Icons.directions_car, color: Color(0xFFF59E0B), size: 40),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'DARSIL AUTOMOTIVE SOLUTIONS',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Text(
                    'Servidor: ${ApiService.currentHost}:${ApiService.currentPort}',
                    style: TextStyle(color: _isConnected ? Colors.greenAccent : Colors.orangeAccent, fontSize: 10),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.assignment, color: Color(0xFFF59E0B)),
              title: const Text('Cotizaciones en Campo', style: TextStyle(color: Colors.white)),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.add_circle, color: Colors.greenAccent),
              title: const Text('Nueva Cotización', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (ctx) => const CreateQuoteScreen())).then((res) {
                  if (res == true) _loadQuotes();
                });
              },
            ),
            ListTile(
              leading: const Icon(Icons.build, color: Colors.amber),
              title: const Text('Catálogo de Mano de Obra', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                _showCatalogDialog();
              },
            ),
            const Divider(color: Color(0xFF1E293B)),
            ListTile(
              leading: const Icon(Icons.settings, color: Colors.lightBlueAccent),
              title: const Text('Configuración de Servidor IP', style: TextStyle(color: Colors.white)),
              subtitle: Text(ApiService.currentHost, style: const TextStyle(color: Colors.grey, fontSize: 11)),
              onTap: () {
                Navigator.pop(context);
                _showServerConfigDialog();
              },
            ),
            ListTile(
              leading: const Icon(Icons.info_outline, color: Colors.grey),
              title: const Text('Acerca del Sistema', style: TextStyle(color: Colors.white)),
              subtitle: const Text('DARSIL Mobile v2.0 • 2026', style: TextStyle(color: Colors.grey, fontSize: 11)),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Row(
          children: [
            Image.asset(
              'assets/logo_transparente.png',
              height: 32,
              errorBuilder: (ctx, err, stack) => const Icon(Icons.flash_on, color: Color(0xFFF59E0B)),
            ),
            const SizedBox(width: 8),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('DARSIL', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.white)),
                Text('MOBILE FIELD APP', style: TextStyle(fontSize: 8, color: Colors.amber, letterSpacing: 0.5)),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.dns, color: _isConnected ? Colors.greenAccent : Colors.orangeAccent, size: 20),
            tooltip: 'Configurar Servidor',
            onPressed: _showServerConfigDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadQuotes,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFF59E0B)))
          : RefreshIndicator(
              onRefresh: _loadQuotes,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF1E293B)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Cotizaciones', style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text('${_quotes.length}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF1E293B)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Total Cotizado', style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text(
                                currencyFormat.format(totalCotizado),
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.greenAccent),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),
                  const Text('Cotizaciones Recientes', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 8),

                  for (final q in _quotes)
                    Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      elevation: 0,
                      color: const Color(0xFF0F172A),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: Color(0xFF1E293B)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E293B),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                                  ),
                                  child: Text(
                                    q.quoteNumber,
                                    style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 11),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: q.status == 'APROBADA' ? Colors.green.withValues(alpha: 0.2) : Colors.blue.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: q.status == 'APROBADA' ? Colors.greenAccent : Colors.lightBlueAccent),
                                  ),
                                  child: Text(
                                    q.status,
                                    style: TextStyle(
                                      color: q.status == 'APROBADA' ? Colors.greenAccent : Colors.lightBlueAccent,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              q.clientName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.directions_car, size: 14, color: Colors.grey),
                                const SizedBox(width: 4),
                                Text(
                                  q.plate.isNotEmpty ? '${q.plate} • ${q.model}' : 'Proyecto Especial',
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                                ),
                              ],
                            ),
                            const Divider(height: 20, color: Color(0xFF1E293B)),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  currencyFormat.format(q.total),
                                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.amber),
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.picture_as_pdf, color: Colors.white70),
                                      onPressed: () => _openPdf(q.id),
                                      tooltip: 'Ver PDF',
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.share, color: Color(0xFF25D366)),
                                      onPressed: () => _shareWhatsApp(q),
                                      tooltip: 'Enviar WhatsApp',
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFF59E0B),
        foregroundColor: const Color(0xFF0F294A),
        icon: const Icon(Icons.add),
        label: const Text('Cotizar en Campo', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: () async {
          final res = await Navigator.push(
            context,
            MaterialPageRoute(builder: (ctx) => const CreateQuoteScreen()),
          );
          if (res == true) {
            _loadQuotes();
          }
        },
      ),
    );
  }
}
