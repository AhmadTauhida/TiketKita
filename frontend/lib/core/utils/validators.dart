final RegExp _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
final RegExp _phonePattern = RegExp(r'^(\+62|62|0)8[0-9]{8,12}$');

String? validateName(String? value) {
  final name = value?.trim() ?? '';

  if (name.isEmpty) {
    return 'Nama wajib diisi';
  }

  if (name.length < 2 || name.length > 100) {
    return 'Nama harus 2-100 karakter';
  }

  return null;
}

String? validateEmail(String? value) {
  final email = value?.trim() ?? '';

  if (email.isEmpty) {
    return 'Email wajib diisi';
  }

  if (email.length > 150 || !_emailPattern.hasMatch(email)) {
    return 'Format email tidak valid';
  }

  return null;
}

String? validatePhone(String? value) {
  final phone = value?.trim() ?? '';

  if (phone.isEmpty) {
    return 'Nomor telepon wajib diisi';
  }

  if (!_phonePattern.hasMatch(phone)) {
    return 'Format nomor telepon tidak valid';
  }

  return null;
}

String? validateLoginPassword(String? value) {
  if (value == null || value.isEmpty) {
    return 'Password wajib diisi';
  }

  return null;
}

String? validatePassword(String? value) {
  if (value == null || value.isEmpty) {
    return 'Password wajib diisi';
  }

  if (value.length < 8) {
    return 'Password minimal 8 karakter';
  }

  if (!RegExp(r'[A-Za-z]').hasMatch(value) ||
      !RegExp(r'[0-9]').hasMatch(value)) {
    return 'Password harus mengandung huruf dan angka';
  }

  return null;
}

String? validateConfirmPassword(String? value, String password) {
  if (value == null || value.isEmpty) {
    return 'Konfirmasi password wajib diisi';
  }

  if (value != password) {
    return 'Konfirmasi password tidak sama';
  }

  return null;
}

String? validateProfileImage(String? value) {
  final text = value?.trim() ?? '';

  if (text.isEmpty) {
    return null;
  }

  final uri = Uri.tryParse(text);

  if (uri == null ||
      (uri.scheme != 'http' && uri.scheme != 'https') ||
      uri.host.isEmpty) {
    return 'URL foto tidak valid';
  }

  return null;
}
