import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/astra/PageHeader";
import { Button } from "@/components/ui/button";
import research from "@/lib/astra/human-research.json";
import { isOfflineBuild, offlineAssetUrl } from "@/lib/astra/local-assets";

/** In the offline build, document images are served from the local bundle. */
function offlineImage(src: string | undefined): string {
  if (!src || !isOfflineBuild) return src ?? "";
  const name = src.split("/").pop();
  return name ? offlineAssetUrl(name) : src;
}

export const Route = createFileRoute("/_mission/learn_/human-research")({
  head: () => ({
    meta: [
      { title: "The Human Research — ASTRA Education Centre" },
      { name: "description", content: "Explore the five hazards of human spaceflight and NASA research, with photographs from The Human Research document." },
      { property: "og:title", content: "The Human Research — ASTRA Education Centre" },
      { property: "og:description", content: "Space radiation, isolation, distance, gravity and closed environments: human spaceflight research and original NASA photographs." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HumanResearch,
});

function linkedText(text: string, links: { text: string; url: string }[] = []): ReactNode[] {
  const result: ReactNode[] = [];
  let offset = 0;
  while (offset < text.length) {
    const next = links
      .filter((link) => link.text && /^https:\/\//.test(link.url))
      .map((link) => ({ ...link, start: text.indexOf(link.text, offset) }))
      .filter((link) => link.start >= offset)
      .sort((a, b) => a.start - b.start)[0];
    if (!next) { result.push(text.slice(offset)); break; }
    result.push(text.slice(offset, next.start));
    result.push(<a key={`${next.start}-${next.url}`} href={next.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary-glow">{next.text}</a>);
    offset = next.start + next.text.length;
  }
  return result;
}

function HumanResearch() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" className="px-0">
        <Link to="/learn"><ArrowLeft /> Education Centre</Link>
      </Button>
      <PageHeader kicker="Human spaceflight · Research" title="The Human Research" />
      <p className="border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground">
        From your supplied document, “The Human Research”. Photographs credited to NASA. Historical statements are reproduced as supplied; this is educational material, not personal medical advice.
      </p>
      <article className="space-y-6 pb-8">
        {research.map((block, index) => {
          if (block.type === "heading") {
            return <h2 key={index} className="border-t border-border pt-8 text-2xl font-semibold text-foreground">{block.text}</h2>;
          }
          if (block.type === "image") {
            return (
              <figure key={index} className="my-8">
                <img src={offlineImage(block.src)} alt={block.caption?.replace(/\s*Credit:.*$/, "") ?? "NASA human spaceflight research"} loading="lazy" className="mx-auto h-auto max-h-[620px] w-full rounded-lg object-contain" />
                {block.caption && <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">{block.caption}</figcaption>}
              </figure>
            );
          }
          const text = block.text ?? "";
          const keyParagraph = text.startsWith("The Key:");
          return (
            <p key={index} className={keyParagraph ? "border-l-2 border-teal pl-4 text-base leading-8 text-foreground" : "text-base leading-8 text-foreground"}>
              {keyParagraph && <strong className="text-teal">The Key: </strong>}
              {linkedText(keyParagraph ? text.slice(9).trimStart() : text, block.links)}
            </p>
          );
        })}
      </article>
    </div>
  );
}