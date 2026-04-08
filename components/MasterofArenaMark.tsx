export function MasterofArenaMark() {
  const name = process.env.NEXT_PUBLIC_APP_NAME ?? "MasterofArena";
  return (
    <span className="font-semibold tracking-tight text-cyan-100">
      {name}
    </span>
  );
}
