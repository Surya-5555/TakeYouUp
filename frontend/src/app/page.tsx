import { TrendyCalendar } from "@/components/calendar/TrendyCalendar";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbb540] py-0 px-4 shadow-inner">
      <TrendyCalendar />
    </main>
  );
}
