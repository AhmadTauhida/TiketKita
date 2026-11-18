class Payment {
  const Payment({
    required this.id,
    required this.paymentMethod,
    required this.status,
    required this.amount,
    this.transactionReference,
    this.paidAt,
  });

  final String id;
  final String paymentMethod;
  final String status;
  final int amount;
  final String? transactionReference;
  final DateTime? paidAt;

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] as String,
      paymentMethod: json['paymentMethod'] as String,
      status: json['status'] as String,
      amount: (json['amount'] as num).toInt(),
      transactionReference: json['transactionReference'] as String?,
      paidAt: json['paidAt'] == null
          ? null
          : DateTime.parse(json['paidAt'] as String),
    );
  }
}
