import EventTabs from "~/app/_components/admin/event-tabs";

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <EventTabs />
      {children}
    </div>
  );
}
