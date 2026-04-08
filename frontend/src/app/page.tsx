import { TrendyCalendar } from "@/components/calendar/TrendyCalendar";

export default function Home() {
  return (
    <main className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#ebebec] to-[#c3c4c8] bg-fixed py-8 px-4 shadow-inner">
      <TrendyCalendar />
    </main>
  );
}
