import Link from "next/link";

const services = [
  {
    title: "Smart Fishing Zones",
    text: "Discover suitable fishing zones and compare their fishing potential.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
    ),
  },
  {
    title: "Ocean Safety",
    text: "Check available ocean and weather conditions before heading out.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    ),
  },
  {
    title: "Fish & Time Insights",
    text: "See expected fish species and recommended fishing times.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
  },
  {
    title: "Distance & Navigation",
    text: "Know how far a selected zone is, how long it may take to reach, and view the route.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11l3-3m0 0l-3-3m3 3H7" /></svg>
    ),
  },
  {
    title: "AI Fishing Assistant",
    text: "Ask questions naturally in English or Kiswahili and receive answers based on Smart Ocean information.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
    ),
  },
  {
    title: "Fishing Reports",
    text: "Record your trip, catch, fuel use, conditions, and observations, then review your fishing history.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    ),
  },
];

export default function Welcome() {
  return (
    <main className="min-h-screen bg-[url('/images/zanzibar-fisher.jpg')] bg-cover bg-center bg-fixed px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[32px] border border-sky-100 bg-white/80 p-6 shadow-[0_30px_80px_-30px_rgba(14,116,144,0.35)] backdrop-blur sm:p-8 lg:p-12 text-center space-y-6">
          <div className="flex justify-center">
            <img src="/smartlogo.jpeg" alt="Smart Ocean Logo" className="h-24 w-24 rounded-full object-cover shadow-md border-2 border-white" />
          </div>
          <p className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
            Smart Ocean • Zanzibar
          </p>
          <h1 className="text-4xl font-black tracking-tight text-blue-950 sm:text-5xl lg:text-6xl">
            Know the Sea. Find the Fish. Fish Smarter.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Smart Ocean helps fishermen discover suitable fishing zones, understand ocean
            conditions, plan when to go, navigate to a selected zone, and keep track of
            every fishing trip.
          </p>
          <p className="mx-auto max-w-2xl text-slate-500">
            From your first location check to your fishing report, Smart Ocean brings
            essential fishing information into one simple experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl bg-blue-800 text-white text-base font-semibold hover:bg-blue-700 transition"
            >
              Start Fishing Smarter
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl border border-blue-300 text-blue-900 text-base font-semibold hover:bg-blue-50 transition"
            >
              Explore Smart Ocean
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="rounded-2xl border border-sky-100 bg-white/80 p-6 backdrop-blur">
              <div className="w-12 h-12 rounded-xl bg-blue-800 text-white flex items-center justify-center">
                {s.icon}
              </div>
              <h2 className="mt-4 text-lg font-bold text-blue-950">{s.title}</h2>
              <p className="mt-2 text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] bg-blue-950 p-6 text-white shadow-xl shadow-blue-950/30 sm:p-8">
          <div className="max-w-xl mx-auto space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Choose your language</h2>
              <p className="text-blue-100">Chagua lugha yako</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-xl bg-white px-4 py-4 text-base font-semibold text-blue-900 transition hover:bg-blue-50"
              >
                English
              </Link>
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-xl border border-blue-700 bg-blue-900 px-4 py-4 text-base font-semibold text-white transition hover:bg-blue-800"
              >
                Kiswahili
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
