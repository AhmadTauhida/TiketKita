import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../models/category.dart';

IconData categoryIcon(String? name) {
  switch (name) {
    case 'school':
      return Icons.school_rounded;
    case 'music_note':
      return Icons.music_note_rounded;
    case 'build':
      return Icons.build_rounded;
    case 'emoji_events':
      return Icons.emoji_events_rounded;
    case 'festival':
      return Icons.festival_rounded;
    default:
      return Icons.category_rounded;
  }
}

class CategoryItem extends StatelessWidget {
  const CategoryItem({super.key, required this.category, required this.onTap});

  final Category category;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Lihat acara kategori ${category.name}',
      child: SizedBox(
        width: 76,
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: Column(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    categoryIcon(category.icon),
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  category.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
