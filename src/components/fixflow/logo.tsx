import Image from "next/image";

export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <Image
      alt="FixFlow mark"
      className={className}
      height={96}
      priority
      src="/fixflow-mark.svg"
      width={96}
    />
  );
}

export function LogoLockup({
  className = "",
  subtitle = "Smart error resolver",
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark className="size-10" />
      <div>
        <p className="font-semibold text-white">FixFlow</p>
        <p className="text-xs text-zinc-400">{subtitle}</p>
      </div>
    </div>
  );
}
