import 'package:flutter_test/flutter_test.dart';
import 'package:tiketkita/main.dart';

void main() {
  testWidgets('shows the TiketKita brand', (WidgetTester tester) async {
    await tester.pumpWidget(const TiketKitaApp());

    expect(find.text('TiketKita'), findsOneWidget);
    expect(
      find.text('Temukan Acara, Pesan Tiket, Nikmati Momen'),
      findsOneWidget,
    );
  });
}
