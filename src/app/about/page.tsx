import Link from "next/link";

const BRAND_GREY = "#8a8a8aff";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="space-y-8">
        <header className="space-y-2">
          <h1
            className="text-[18px] italic"
            style={{
              fontFamily: "var(--font-libre), Libre Baskerville, serif",
              color: BRAND_GREY,
            }}
          >
            About and Methodology
          </h1>

          <p
            className="max-w-3xl pt-1 text-xs leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            Pattern Curator Curatorial Intelligence (CI) is a visual intelligence
            system designed to help designers move from inspiration to
            direction—faster, with more clarity, and without losing their point of
            view.
          </p>

          <p
            className="max-w-3xl text-xs leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            CI sits at the intersection of intuition and intelligence—where Pattern
            Curator’s editorial direction is supported by AI-assisted insight, not
            automated decision-making.
          </p>
        </header>

        <section className="space-y-3">
          <h2
            className="text-[12px] font-bold tracking-wide uppercase"
            style={{ color: BRAND_GREY }}
          >
            What is Pattern Curator Curatorial Intelligence?
          </h2>

          <p
            className="max-w-3xl text-xs leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            Curatorial Intelligence combines a curated visual library with a guided
            interpretation layer. The library is edited, tagged, and organized to
            support real creative work. The interpretation layer is optional—use it
            when you want clarity, language, or a directional frame.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-[12px] font-bold tracking-wide uppercase"
            style={{ color: BRAND_GREY }}
          >
            Methodology
          </h2>

          <div
            className="max-w-3xl space-y-2 text-xs leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            <p>
              1) Curate: We build and maintain a library with editorial
              standards—cohesive, relevant, and designed to reduce noise.
            </p>
            <p>
              2) Lens: You narrow by category (trend, concept, moodboards, color,
              print and pattern) to focus the signal.
            </p>
            <p>
              3) Interpret: When needed, CI helps translate visuals into usable
              direction—what it is, why it matters, and where it can go next.
            </p>
            <p>4) Apply: You decide what to keep. CI is directional, not prescriptive.</p>

            {/* Warm editorial/research clarification */}
            <p>
              Images within CI are curated as editorial references—selected to
              support Pattern Curator’s methodology, context-building, and
              interpretation, rather than to function as standalone assets.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2
            className="text-[12px] font-bold tracking-wide uppercase"
            style={{ color: BRAND_GREY }}
          >
            How to use CI
          </h2>

          <div
            className="max-w-3xl space-y-2 text-xs leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            <p>• Start broad in Curate.</p>
            <p>• Save what resonates and refine your lens.</p>
            <p>• Use Inspiration categories to build a stronger point of view.</p>
            <p>• Generate interpretation only when it helps you move forward.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2
            className="text-[12px] font-bold tracking-wide uppercase"
            style={{ color: BRAND_GREY }}
          >
            Beta note
          </h2>

          <p
            className="max-w-3xl text-xs leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            This is a Beta release. You may see small changes as performance and
            features are refined. If something feels off, please share what happened
            and what you expected.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-[12px] font-bold tracking-wide uppercase"
            style={{ color: BRAND_GREY }}
          >
            Contact
          </h2>

          <p
            className="max-w-3xl text-xs leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            For support, feedback, or access questions, email{" "}
            <a
              className="underline"
              style={{ color: BRAND_GREY }}
              href="mailto:info@patterncurator.com"
            >
              info@patterncurator.com
            </a>
            .
          </p>
        </section>

        <div className="pt-4">
          <Link
            href="/"
            className="h-9 rounded-full px-6 text-[11px] inline-flex items-center justify-center"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              border: "1px solid #B8B9B6",
              color: "#707376ff",
              background: "#f4f4f4",
            }}
          >
            Back to Curate
          </Link>
        </div>
      </div>
    </main>
  );
}
