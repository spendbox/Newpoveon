import { IllustrationCard } from "@/components/illustrations";
import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[430px] px-6 pt-7">
      <Logo />
      <IllustrationCard name="mood" className="mt-5" />
      <h1 className="mt-5 text-[30px]">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">If someone shared a link with you, they may have turned it off.</p>
      <ButtonLink href="/" className="mt-6 w-full">Go to the homepage</ButtonLink>
    </main>
  );
}
