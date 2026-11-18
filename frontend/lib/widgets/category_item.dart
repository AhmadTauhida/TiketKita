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
  const CategoryItem({super.key, required this.category});

  final Category category;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 76,
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
    );
  }
}
