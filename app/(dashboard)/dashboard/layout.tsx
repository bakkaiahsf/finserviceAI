export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Clean dashboard layout - no unnecessary navigation elements
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
