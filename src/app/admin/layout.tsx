/** This boundary exists in the first streamed HTML, including authentication fallbacks. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="ax-admin ax-admin-root">{children}</div>;
}
