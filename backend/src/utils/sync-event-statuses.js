export async function syncEventStatuses(tx) {
  const now = new Date();

  const completed = await tx.event.updateMany({
    where: {
      status: { in: ['UPCOMING', 'ONGOING'] },
      OR: [
        { endDate: { lt: now } },
        { endDate: null, eventDate: { lt: now } },
      ],
    },
    data: { status: 'COMPLETED' },
  });

  const ongoing = await tx.event.updateMany({
    where: {
      status: 'UPCOMING',
      eventDate: { lte: now },
      endDate: { gt: now },
    },
    data: { status: 'ONGOING' },
  });

  return completed.count + ongoing.count;
}
