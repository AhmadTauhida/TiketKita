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
