class User {
  const User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.profileImage,
    this.createdAt,
  });

  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? profileImage;
  final DateTime? createdAt;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      profileImage: json['profileImage'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );
  }
}
