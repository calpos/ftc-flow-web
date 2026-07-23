export function memberBadgeColors(id: string): { bg: string; text: string } {
  const hue = hashId(id) % 360;
  return { bg: `hsl(${hue}, 50%, 28%)`, text: '#f0f0f5' };
}

function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 33) ^ id.charCodeAt(i)) >>> 0;
  }
  return h;
}
