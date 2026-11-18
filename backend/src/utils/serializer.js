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
