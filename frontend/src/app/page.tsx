import { TrendyCalendar } from "@/components/trendy-calendar";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbb540] py-4 px-4 shadow-inner">
      <TrendyCalendar />
    </main>
  );
}
