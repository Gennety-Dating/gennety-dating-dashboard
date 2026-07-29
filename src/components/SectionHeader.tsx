interface SectionHeaderProps {
  title: string;
  description?: string;
}

export default function SectionHeader({
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col justify-start">
      <div className="flex items-center gap-2.5">
        <div className="h-4 w-1.5 rounded-full bg-gradient-to-b from-rose-500 to-rose-900 shadow-md shadow-rose-950/80 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.4)]" />
        <h2 className="text-lg font-extrabold tracking-tight text-white">{title}</h2>
      </div>
      {description && (
        <p className="mt-1 text-xs font-medium text-rose-200/60 pl-4 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
