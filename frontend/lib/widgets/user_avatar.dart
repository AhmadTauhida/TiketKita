import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';

class UserAvatar extends StatelessWidget {
  const UserAvatar({
    super.key,
    required this.name,
    this.imageUrl,
    this.imageProvider,
    this.size = 80,
  });

  final String name;
  final String? imageUrl;
  final ImageProvider? imageProvider;
  final double size;

  String get _initials {
    final words = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((word) => word.isNotEmpty)
        .toList();

    if (words.isEmpty) {
      return '?';
    }

    if (words.length == 1) {
      return words.first.substring(0, 1).toUpperCase();
    }

    return '${words.first.substring(0, 1)}${words[1].substring(0, 1)}'
        .toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      color: AppColors.primary.withValues(alpha: 0.12),
      alignment: Alignment.center,
      child: Text(
        _initials,
        style: TextStyle(
          color: AppColors.primary,
          fontSize: size * 0.34,
          fontWeight: FontWeight.bold,
        ),
      ),
    );

    final Widget content;

    if (imageProvider != null) {
      content = Image(
        image: imageProvider!,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => fallback,
      );
    } else if (imageUrl == null || imageUrl!.isEmpty) {
      content = fallback;
    } else {
      content = Image.network(
        imageUrl!,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => fallback,
        loadingBuilder: (context, child, progress) {
          if (progress == null) {
            return child;
          }

          return fallback;
        },
      );
    }

    return ClipOval(
      child: SizedBox(width: size, height: size, child: content),
    );
  }
}
