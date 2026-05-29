export function maskSchoolName(name: string): string {
  if (!name) return "";
  if (name.length <= 2) return name.substring(0, 1) + "*";
  const first = name.substring(0, 1);
  const last = name.substring(name.length - 1);
  const masked = "*".repeat(name.length - 2);
  return first + masked + last;
}

export function maskPersonName(name: string): string {
  if (!name) return "";
  if (name.length === 2) return name.substring(0, 1) + "*";
  if (name.length > 2) {
    const first = name.substring(0, 1);
    const last = name.substring(name.length - 1);
    const masked = "*".repeat(name.length - 2);
    return first + masked + last;
  }
  return name;
}
