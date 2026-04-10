interface SectionHeaderProps {
  title: string;
  description?: string;
}

export default function SectionHeader({
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-0.5 text-sm text-slate-400">{description}</p>
      )}
    </div>
  );
}
