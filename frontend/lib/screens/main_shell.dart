import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../routes/app_routes.dart';
import '../state/auth_state.dart';
import 'explore/explore_screen.dart';
import 'home/home_screen.dart';
import 'profile/profile_screen.dart';
import 'tickets/my_tickets_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, this.initialTab = 0});

  final int initialTab;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  final FocusNode _exploreSearchFocus = FocusNode();
  late int _index = widget.initialTab.clamp(0, 3);
  int _categoryShortcutRevision = 0;
  CategoryShortcutRequest? _categoryShortcut;

  @override
  void dispose() {
    _exploreSearchFocus.dispose();
    super.dispose();
  }

  void _selectTab(int index) {
    setState(() => _index = index);
  }

  void _openExploreSearch() {
    _selectTab(1);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _exploreSearchFocus.requestFocus();
      }
    });
  }

  void _openCategoryShortcut(String categoryId) {
    setState(() {
      _index = 1;
      _categoryShortcut = CategoryShortcutRequest(
        categoryId: categoryId,
        revision: ++_categoryShortcutRevision,
      );
    });
  }

  Future<void> _onDestinationSelected(int index) async {
    final needsLogin = index == 2 || index == 3;

    if (needsLogin && !context.read<AuthState>().isLoggedIn) {
      final result = await Navigator.of(context).pushNamed(AppRoutes.login);

      if (!mounted || result != true) {
        return;
      }

      _selectTab(index);
      return;
    }

    _selectTab(index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: [
          HomeScreen(
            onSearchTap: _openExploreSearch,
            onCategoryTap: _openCategoryShortcut,
          ),
          ExploreScreen(
            searchFocusNode: _exploreSearchFocus,
            categoryShortcut: _categoryShortcut,
          ),
          const MyTicketsScreen(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _onDestinationSelected,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore_rounded),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Icon(Icons.confirmation_number_outlined),
            selectedIcon: Icon(Icons.confirmation_number_rounded),
            label: 'My Tickets',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
