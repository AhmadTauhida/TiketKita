import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/utils/validators.dart';
import '../../state/auth_state.dart';
import '../../widgets/form_error_banner.dart';
import '../../widgets/user_avatar.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  static const int _maxPhotoBytes = 2 * 1024 * 1024;

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _imagePicker = ImagePicker();

  String _email = '';
  String _initialName = '';
  String _initialPhone = '';
  XFile? _selectedPhoto;
  bool _removePhoto = false;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthState>().user;

    _email = user?.email ?? '';
    _initialName = user?.name ?? '';
    _initialPhone = user?.phone ?? '';
    _nameController.text = _initialName;
    _phoneController.text = _initialPhone;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    if (_loading) {
      return;
    }

    try {
      final photo = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );

      if (photo == null) {
        return;
      }

      final length = await photo.length();

      if (length == 0) {
        setState(() {
          _error = 'File foto tidak dapat dibaca.';
        });
        return;
      }

      if (length > _maxPhotoBytes) {
        setState(() {
          _error = 'Ukuran foto maksimal 2 MB';
        });
        return;
      }

      setState(() {
        _selectedPhoto = photo;
        _removePhoto = false;
        _error = null;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = 'Gagal memilih foto. Coba lagi.';
      });
    }
  }

  void _removeSelectedPhoto() {
    if (_loading) {
      return;
    }

    setState(() {
      _selectedPhoto = null;
      _removePhoto = true;
      _error = null;
    });
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final authState = context.read<AuthState>();
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final photo = _selectedPhoto;

    setState(() {
      _loading = true;
      _error = null;
    });

    var photoUploaded = false;

    try {
      if (photo != null) {
        await authState.uploadProfilePhoto(
          filePath: photo.path,
          filename: photo.name,
        );
        photoUploaded = true;

        if (!mounted) {
          return;
        }

        setState(() {
          _selectedPhoto = null;
        });
      }

      final nameChanged = name != _initialName;
      final phoneChanged = phone != _initialPhone;
      final shouldUpdate = nameChanged || phoneChanged || _removePhoto;

      if (shouldUpdate) {
        await authState.updateProfile(
          name: name,
          phone: phone,
          clearProfileImage: _removePhoto,
        );

        _initialName = name;
        _initialPhone = phone;
        _removePhoto = false;
      }

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profil berhasil diperbarui')),
      );
      Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _loading = false;
        _error = photoUploaded && error.statusCode != 401
            ? 'Foto profil berhasil diperbarui, tetapi data profil gagal diperbarui. ${error.message}'
            : error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _loading = false;
        _error = photoUploaded
            ? 'Foto profil berhasil diperbarui, tetapi data profil gagal diperbarui.'
            : 'Terjadi kesalahan saat memperbarui profil.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthState>().user;
    final hasPhoto =
        _selectedPhoto != null ||
        (!_removePhoto && (user?.profileImage?.isNotEmpty ?? false));
    final preview = _selectedPhoto;

    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profil')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: UserAvatar(
                        name: _nameController.text,
                        imageUrl: _removePhoto ? null : user?.profileImage,
                        imageProvider: preview == null
                            ? null
                            : FileImage(File(preview.path)),
                        size: 96,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        TextButton.icon(
                          onPressed: _loading ? null : _pickPhoto,
                          icon: const Icon(Icons.photo_library_outlined),
                          label: const Text('Ubah Foto'),
                        ),
                        if (hasPhoto) ...[
                          const SizedBox(width: 8),
                          TextButton.icon(
                            onPressed: _loading ? null : _removeSelectedPhoto,
                            icon: const Icon(Icons.delete_outline_rounded),
                            label: const Text('Hapus Foto'),
                          ),
                        ],
                        if (_removePhoto) ...[
                          const SizedBox(width: 8),
                          TextButton.icon(
                            onPressed: _loading
                                ? null
                                : () => setState(() => _removePhoto = false),
                            icon: const Icon(Icons.undo_rounded),
                            label: const Text('Batal Hapus'),
                          ),
                        ],
                      ],
                    ),
                    Center(
                      child: Text(
                        _removePhoto
                            ? 'Foto akan dihapus saat kamu menyimpan.'
                            : 'JPG, PNG, atau WebP • maksimal 2 MB',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (_error != null) ...[
                      FormErrorBanner(message: _error!),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _nameController,
                      textInputAction: TextInputAction.next,
                      validator: validateName,
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(
                        labelText: 'Nama lengkap',
                        prefixIcon: Icon(Icons.person_outline_rounded),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      initialValue: _email,
                      enabled: false,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.mail_outline_rounded),
                        helperText: 'Email tidak dapat diubah',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      textInputAction: TextInputAction.done,
                      validator: validatePhone,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: const InputDecoration(
                        labelText: 'Nomor telepon',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: FilledButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                ),
                              )
                            : const Text('Simpan'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
