export function MasterofArenaMark() {
  const name = process.env.NEXT_PUBLIC_APP_NAME ?? "MasterofArena";
  return (
    <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
      {name}
    </span>
  );
}
