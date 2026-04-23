import Link from "next/link";

// ACH-022 compliance-privacidade: small footer link promoting data-subject
// rights (LGPD art. 18-22 / GDPR art. 15-22). Drop below forms that collect
// PII to keep the rights visible to the user.

interface DataRightsLinkProps {
  className?: string;
}

export function DataRightsLink({ className }: DataRightsLinkProps) {
  return (
    <p
      className={
        "text-caption text-[var(--color-text-tertiary)] " + (className ?? "")
      }
    >
      <Link href="/privacy-policy#direitos" className="hover:underline">
        Conheça seus direitos (LGPD art. 18-22)
      </Link>
    </p>
  );
}
