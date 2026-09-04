interface SectionHeaderProps {
  title: string;
  /**
   * One line of orientation for the section — what it is measured over, or a
   * caveat that changes how the numbers read. Omit it when the title already
   * says everything; a restatement is noise with extra steps.
   */
  description?: string;
}

export default function SectionHeader({
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
        {title}
      </h2>
      {description && (
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}
