import Link from "next/link";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./Button";

export function LinkButton({
  href,
  children,
  variant = "secondary",
  size = "md",
  className,
  target,
  rel,
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  target?: string;
  rel?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={buttonClasses({ variant, size, className })}
    >
      {children}
    </Link>
  );
}
