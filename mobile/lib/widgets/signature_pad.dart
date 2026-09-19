import 'package:flutter/material.dart';

class SignaturePadWidget extends StatefulWidget {
  final Function(List<Offset?> points) onSignatureChanged;
  final VoidCallback onClear;

  const SignaturePadWidget({
    super.key,
    required this.onSignatureChanged,
    required this.onClear,
  });

  @override
  State<SignaturePadWidget> createState() => _SignaturePadWidgetState();
}

class _SignaturePadWidgetState extends State<SignaturePadWidget> {
  final List<Offset?> _points = [];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Firma Digital de Conformidad (Táctil):',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF0F294A)),
            ),
            TextButton.icon(
              onPressed: () {
                setState(() {
                  _points.clear();
                });
                widget.onClear();
              },
              icon: const Icon(Icons.clear, size: 14, color: Colors.red),
              label: const Text('Limpiar', style: TextStyle(fontSize: 11, color: Colors.red)),
            ),
          ],
        ),
        Container(
          height: 140,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: GestureDetector(
              onPanUpdate: (DragUpdateDetails details) {
                final localPosition = details.localPosition;
                setState(() {
                  _points.add(localPosition);
                });
                widget.onSignatureChanged(_points);
              },
              onPanEnd: (DragEndDetails details) {
                setState(() {
                  _points.add(null);
                });
                widget.onSignatureChanged(_points);
              },
              child: CustomPaint(
                painter: _SignaturePainter(points: _points),
                size: Size.infinite,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        const Center(
          child: Text(
            'Firme sobre el recuadro con el dedo o stylus táctil',
            style: TextStyle(fontSize: 10, color: Colors.grey, fontStyle: FontStyle.italic),
          ),
        ),
      ],
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<Offset?> points;

  _SignaturePainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = const Color(0xFF0F294A)
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 3.0;

    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter oldDelegate) {
    return true;
  }
}
