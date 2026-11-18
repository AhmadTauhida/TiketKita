ALTER TABLE ticket_types ADD CONSTRAINT chk_ticket_types_price CHECK (price >= 0);
ALTER TABLE ticket_types ADD CONSTRAINT chk_ticket_types_quota CHECK (quota >= 0);
ALTER TABLE ticket_types ADD CONSTRAINT chk_ticket_types_stock CHECK (available_stock >= 0 AND available_stock <= quota);
ALTER TABLE bookings ADD CONSTRAINT chk_bookings_total CHECK (total_amount >= 0);
ALTER TABLE booking_details ADD CONSTRAINT chk_booking_details_qty CHECK (quantity > 0);
ALTER TABLE booking_details ADD CONSTRAINT chk_booking_details_price CHECK (unit_price >= 0 AND subtotal >= 0);
ALTER TABLE booking_details ADD CONSTRAINT chk_booking_details_subtotal CHECK (subtotal = quantity * unit_price);
ALTER TABLE payments ADD CONSTRAINT chk_payments_amount CHECK (amount >= 0);
