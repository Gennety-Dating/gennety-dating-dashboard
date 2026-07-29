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
        <div className="h-4 w-1 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500 shadow-sm shadow-violet-500/50" />
        <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
      </div>
      {description && (
        <p className="mt-1 text-xs text-slate-400/90 pl-3.5 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
