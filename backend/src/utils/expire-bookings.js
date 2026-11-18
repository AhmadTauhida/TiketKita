export async function expireOverdueBookings(tx, { userId, bookingId } = {}) {
  const where = {
    status: 'PENDING',
    expiresAt: { lte: new Date() },
  };

  if (userId) {
    where.userId = userId;
  }

  if (bookingId) {
    where.id = bookingId;
  }

  const overdueBookings = await tx.booking.findMany({
    where,
    include: {
      details: {
        select: {
          ticketTypeId: true,
          quantity: true,
        },
      },
    },
  });

  let expiredCount = 0;

  for (const booking of overdueBookings) {
    const updated = await tx.booking.updateMany({
      where: { id: booking.id, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });

    if (updated.count !== 1) {
      continue;
    }

    expiredCount += 1;

    for (const detail of booking.details) {
      await tx.ticketType.update({
        where: { id: detail.ticketTypeId },
        data: { availableStock: { increment: detail.quantity } },
      });
    }
  }

  return expiredCount;
}
