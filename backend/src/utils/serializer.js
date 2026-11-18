export function toNumber(value) {
  if (value === null || value === undefined) {
    return value;
  }

  return Number(value);
}

export function toIsoString(value) {
  if (value === null || value === undefined) {
    return value;
  }

  return new Date(value).toISOString();
}

export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    createdAt: toIsoString(user.createdAt),
  };
}

export function serializeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    icon: category.icon,
  };
}

function serializeEventPricing(event) {
  const prices = event.ticketTypes.map((ticketType) => Number(ticketType.price));

  return {
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    isSoldOut:
      event.ticketTypes.length > 0 &&
      event.ticketTypes.every((ticketType) => ticketType.availableStock === 0),
  };
}

export function serializeEventSummary(event) {
  return {
    id: event.id,
    title: event.title,
    imageUrl: event.imageUrl,
    category: {
      id: event.category.id,
      name: event.category.name,
    },
    organizer: event.organizer,
    location: event.location,
    eventDate: toIsoString(event.eventDate),
    endDate: toIsoString(event.endDate),
    status: event.status,
    ...serializeEventPricing(event),
  };
}

export function serializeEventDetail(event) {
  return {
    ...serializeEventSummary(event),
    description: event.description,
    address: event.address,
    canBook: event.status === 'UPCOMING' && new Date(event.eventDate).getTime() > Date.now(),
    ticketTypes: event.ticketTypes.map((ticketType) => ({
      id: ticketType.id,
      name: ticketType.name,
      description: ticketType.description,
      price: toNumber(ticketType.price),
      quota: ticketType.quota,
      availableStock: ticketType.availableStock,
    })),
  };
}

export function serializePayment(payment) {
  return {
    id: payment.id,
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    amount: toNumber(payment.amount),
    transactionReference: payment.transactionReference,
    paidAt: toIsoString(payment.paidAt),
  };
}

export function serializeBooking(booking) {
  const event = booking.details[0]?.ticketType?.event;

  return {
    id: booking.id,
    bookingCode: booking.bookingCode,
    status: booking.status,
    totalAmount: toNumber(booking.totalAmount),
    totalQuantity: booking.details.reduce((total, detail) => total + detail.quantity, 0),
    expiresAt: toIsoString(booking.expiresAt),
    createdAt: toIsoString(booking.createdAt),
    event: event
      ? {
          id: event.id,
          title: event.title,
          imageUrl: event.imageUrl,
          eventDate: toIsoString(event.eventDate),
          location: event.location,
        }
      : null,
    items: booking.details.map((detail) => ({
      id: detail.id,
      ticketTypeId: detail.ticketTypeId,
      ticketTypeName: detail.ticketType.name,
      quantity: detail.quantity,
      unitPrice: toNumber(detail.unitPrice),
      subtotal: toNumber(detail.subtotal),
    })),
    payment: booking.payment ? serializePayment(booking.payment) : null,
  };
}
