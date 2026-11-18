import 'package:flutter_test/flutter_test.dart';
import 'package:tiketkita/core/utils/validators.dart';

void main() {
  test('validateEmail menerima email valid dan menolak yang salah', () {
    expect(validateEmail('demo@tiketkita.test'), isNull);
    expect(validateEmail('bukan-email'), isNotNull);
    expect(validateEmail(''), isNotNull);
  });

  test('validatePhone mengikuti format Indonesia', () {
    expect(validatePhone('081234567890'), isNull);
    expect(validatePhone('+6281234567890'), isNull);
    expect(validatePhone('12345'), isNotNull);
  });

  test('validatePassword mensyaratkan 8 karakter, huruf, dan angka', () {
    expect(validatePassword('Demo1234'), isNull);
    expect(validatePassword('demo'), isNotNull);
    expect(validatePassword('12345678'), isNotNull);
    expect(validatePassword('abcdefgh'), isNotNull);
  });

  test('validateConfirmPassword harus sama', () {
    expect(validateConfirmPassword('Demo1234', 'Demo1234'), isNull);
    expect(validateConfirmPassword('Demo1234', 'Demo12345'), isNotNull);
  });

  test('validateProfileImage opsional dan harus URL http/https', () {
    expect(validateProfileImage(''), isNull);
    expect(validateProfileImage('https://example.com/avatar.png'), isNull);
    expect(validateProfileImage('http://example.com/avatar.png'), isNull);
    expect(validateProfileImage('bukan-url'), isNotNull);
    expect(validateProfileImage('ftp://example.com/avatar.png'), isNotNull);
  });
}
