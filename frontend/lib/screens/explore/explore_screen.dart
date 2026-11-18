import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_theme.dart';
import '../../models/category.dart';
import '../../models/event_summary.dart';
import '../../routes/app_routes.dart';
import '../../services/event_service.dart';
import '../../widgets/event_card.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key, this.searchFocusNode});

  final FocusNode? searchFocusNode;

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  static const int _pageSize = 10;

  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late final FocusNode _focusNode = widget.searchFocusNode ?? FocusNode();
  late final bool _ownsFocusNode = widget.searchFocusNode == null;

  Timer? _debounce;
  List<Category> _categories = const [];
  List<EventSummary> _events = const [];
  String? _selectedCategoryId;
  String? _error;
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  int _page = 1;
  int _requestId = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadCategories();
    _load(reset: true);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    if (_ownsFocusNode) {
      _focusNode.dispose();
    }
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await context.read<EventService>().getCategories();

      if (!mounted) {
        return;
      }

      setState(() => _categories = categories);
    } catch (_) {
      // Kategori opsional; daftar acara tetap dimuat.
    }
  }

  Future<void> _load({required bool reset}) async {
    if (!reset && (_loadingMore || !_hasMore || _loading)) {
      return;
    }

    final requestId = reset ? ++_requestId : _requestId;

    setState(() {
      if (reset) {
        _loading = true;
        _error = null;
      } else {
        _loadingMore = true;
      }
    });

    try {
      final page = await context.read<EventService>().getEvents(
            q: _searchController.text,
            categoryId: _selectedCategoryId,
            page: reset ? 1 : _page + 1,
            limit: _pageSize,
          );

      if (!mounted || requestId != _requestId) {
        return;
      }

      setState(() {
        _events = reset ? page.items : [..._events, ...page.items];
        _page = page.page;
        _hasMore = page.page < page.totalPages;
        _loading = false;
        _loadingMore = false;
        _error = null;
      });
    } catch (error) {
      if (!mounted || requestId != _requestId) {
        return;
      }

      final message = error is ApiException
          ? error.message
          : 'Terjadi kesalahan saat memuat data.';

      setState(() {
        _loading = false;
        _loadingMore = false;
        if (reset) {
          _error = message;
        }
      });

      if (!reset) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    }
  }

  Future<void> _refresh() => _load(reset: true);

  void _onScroll() {
    if (!_scrollController.hasClients) {
      return;
    }

    if (_scrollController.position.extentAfter < 300) {
      _load(reset: false);
    }
  }

  void _onSearchChanged(String value) {
    setState(() {});

    _debounce?.cancel();
    _debounce = Timer(
      const Duration(milliseconds: 400),
      () => _load(reset: true),
    );
  }

  void _submitSearch() {
    _debounce?.cancel();
    _load(reset: true);
  }

  void _clearSearch() {
    _debounce?.cancel();
    _searchController.clear();
    setState(() {});
    _load(reset: true);
    _focusNode.requestFocus();
  }

  void _selectCategory(String? categoryId) {
    if (_selectedCategoryId == categoryId) {
      return;
    }

    setState(() => _selectedCategoryId = categoryId);
    _load(reset: true);
  }

  void _openEvent(EventSummary event) {
    Navigator.of(context).pushNamed(
      AppRoutes.eventDetail,
      arguments: event.id,
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Explore',
                  style: Theme.of(context)
                      .textTheme
                      .headlineSmall
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                _buildSearchField(),
              ],
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length + 1,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _buildCategoryChip('Semua', null);
                }

                final category = _categories[index - 1];
                return _buildCategoryChip(category.name, category.id);
              },
            ),
          ),
          const SizedBox(height: 8),
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildSearchField() {
    return TextField(
      controller: _searchController,
      focusNode: _focusNode,
      textInputAction: TextInputAction.search,
      onChanged: _onSearchChanged,
      onSubmitted: (_) => _submitSearch(),
      decoration: InputDecoration(
        hintText: 'Cari acara atau penyelenggara',
        prefixIcon: const Icon(Icons.search_rounded),
        suffixIcon: _searchController.text.isEmpty
            ? null
            : IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: _clearSearch,
              ),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String label, String? categoryId) {
    final selected = _selectedCategoryId == categoryId;

    return ChoiceChip(
      label: Text(label),
      selected: selected,
      showCheckmark: false,
      selectedColor: AppColors.primary.withValues(alpha: 0.12),
      labelStyle: TextStyle(
        color: selected
            ? AppColors.primary
            : Theme.of(context).colorScheme.onSurfaceVariant,
        fontWeight: selected ? FontWeight.bold : FontWeight.normal,
      ),
      onSelected: (_) => _selectCategory(categoryId),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null && _events.isEmpty) {
      return _ErrorState(
        message: _error!,
        onRetry: () => _load(reset: true),
      );
    }

    if (_events.isEmpty) {
      return RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 96),
            _EmptyState(),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView.builder(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        itemCount: _events.length + (_loadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= _events.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                ),
              ),
            );
          }

          final event = _events[index];

          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: EventCard(
              event: event,
              onTap: () => _openEvent(event),
            ),
          );
        },
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Icon(
            Icons.search_off_rounded,
            size: 48,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 12),
          Text(
            'Tidak ada acara ditemukan',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            'Coba kata kunci atau kategori lain.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.wifi_off_rounded,
              size: 48,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => onRetry(),
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      ),
    );
  }
}
