/** Only known private admin record types may become navigation targets. */
export function notificationEntityHref(type: string, id: string): string | null {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const routes: Record<string, string> = {
    website_order: "/admin/orders",
    template_request: "/admin/template-requests",
    contact_message: "/admin/support",
  };
  return Object.hasOwn(routes, type) ? `${routes[type]}/${id}` : null;
}
