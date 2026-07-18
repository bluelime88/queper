// Ready-notification copy per business type (PRD section 12).
export function readyMessage(type, label, number) {
  switch (type) {
    case 'restaurant':
      return { title: 'Order ready', body: `Your order #${number} is ready. Please proceed to the pickup counter.` };
    case 'clinic':
      return { title: "You're being called", body: `Queue #${number} is ready. Please proceed to the indicated room.` };
    case 'pharmacy':
      return { title: 'Ready for pickup', body: `Claim #${number} is ready for pickup.` };
    case 'service_center':
      return { title: 'Now serving', body: `Queue #${number} is now being served. Please proceed to the counter.` };
    default:
      return { title: "It's your turn", body: `${label} #${number} is ready. Please proceed to the counter.` };
  }
}
