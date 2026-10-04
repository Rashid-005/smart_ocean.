export default function BrandLogo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <img
        src="/smartlogo.jpeg"
        alt="Smart Ocean logo"
        className="h-9 w-9 rounded-full object-cover border border-white/30"
      />
      <span className={`text-xl font-bold tracking-wider ${dark ? "text-blue-950" : "text-white"}`}>
        SMART OCEAN
      </span>
    </span>
  );
}
