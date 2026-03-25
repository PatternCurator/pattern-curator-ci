import Link from "next/link";

const BRAND_GREY = "#5f6368";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl space-y-16">
        {/* HEADER — MATCH MOODBOARDS / SEASONS */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h1
              className="text-[22px] uppercase tracking-[0.24em] text-neutral-900"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontWeight: 300,
              }}
            >
              About and Methodology
            </h1>

            <p
              className="text-[14px] italic text-neutral-500"
              style={{
                fontFamily: "var(--font-libre), Libre Baskerville, serif",
              }}
            >
              Curatorial framework connecting visual exploration to applied design direction
            </p>
          </div>
        </section>

        {/* INTRO */}
        <section className="max-w-4xl space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Pattern Curator Curatorial Intelligence™ (CI) is a curated visual
            research platform designed to help designers move from visual
            exploration to clearer creative direction.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Curatorial Intelligence builds on the foundation of Pattern Curator,
            evolving it into a more focused editorial system that pairs curated
            moodboards with AI-assisted interpretation.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            CI sits at the intersection of editorial direction and structured
            insight. It is designed to support creative thinking, sharpen
            decision-making, and help translate visual signals into more usable
            design direction.
          </p>
        </section>

        {/* WHAT IS CI */}
        <section className="max-w-4xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            What is Curatorial Intelligence
          </h2>

          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: BRAND_GREY }}>
{`Curatorial Intelligence combines a curated collection of editorial
moodboards with an interpretation layer powered by AI. Curation is not about
predicting or chasing trends. It is about paying close attention and knowing
what story you want to tell that feels relevant, inspiring, and evolutionary.

Pattern Curator has always been rooted in the practice of curation — observing
visual shifts, analyzing human behaviors, collecting fragments of culture, and
identifying the details that begin to shape creative direction.`}
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Each board is selected and organized to highlight emerging visual
            signals across color, print, surface, and cultural direction. The
            interpretation layer adds context when greater clarity,
            articulation, or directional framing is needed.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Together, they pair visual discovery with structured insight.
          </p>
        </section>

        {/* METHODOLOGY */}
        <section className="max-w-4xl space-y-6">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Methodology
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Curatorial Intelligence operates through a three-part framework
            designed to move from visual exploration to applied design
            direction.
          </p>

          <div
            className="space-y-4 text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            <p>
              <strong>1 Curate</strong>
              <br />
              A focused collection of editorial moodboards built and maintained
              with a strong point of view — selective, relevant, and designed to
              reduce noise.
            </p>

            <p>
              <strong>2 Interpret</strong>
              <br />
              Translate visual references into structured insight through
              Curatorial Intelligence notes, including directional context,
              design relevance, and broader creative meaning.
            </p>

            <p>
              <strong>3 Apply</strong>
              <br />
              Use Application Query to translate a board’s direction into
              specific product or category thinking, such as swim, lounge, knit
              tops, accessories, and more.
            </p>
          </div>
        </section>

        {/* COLOR INTELLIGENCE */}
        <section className="max-w-4xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Color Intelligence
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            CI moodboards now include automatically extracted color palettes
            calibrated to the visual composition of each board.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            The palette system analyzes each moodboard image and identifies key
            color relationships within the visual reference set. Palettes are
            rendered directly in CI as color chips with corresponding hex values
            and descriptive naming.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            This extends Curatorial Intelligence beyond visual discovery and
            interpretation into more structured color direction — supporting
            palette building, product development, and assortment planning.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Palette data is stored alongside each board as part of the
            Curatorial Intelligence workflow, creating a consistent and
            repeatable system across the platform.
          </p>
        </section>

        {/* IMAGE USAGE */}
        <section className="max-w-4xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Image Usage
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Images within CI are curated as editorial references selected to
            support context, methodology, and interpretation. They are presented
            as part of a visual research and analysis system, not as standalone
            downloadable assets or image ownership.
          </p>
        </section>

        {/* HOW TO USE */}
        <section className="max-w-4xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            How to Use CI
          </h2>

          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            <p>• Explore the boards to identify emerging visual direction.</p>
            <p>
              • Open an individual board to view Curatorial Intelligence notes,
              extracted palette data, and contextual interpretation.
            </p>
            <p>
              • Use Application Query to translate visual direction into
              product, category, or concept-specific thinking.
            </p>
            <p>
              • Move through boards sequentially to compare signals, themes, and
              evolving direction.
            </p>
          </div>
        </section>

        {/* APPLICATION */}
        <section className="max-w-4xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Application Query
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Application Query extends CI from visual exploration into applied
            design thinking.
          </p>

          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            <p>
              Enter a category such as swim, lounge, knit tops, or accessories
              to receive structured insight through the Pattern Curator lens,
              including:
            </p>
            <p>• Direction translation</p>
            <p>• Color strategy</p>
            <p>• Print and surface application</p>
            <p>• Fabric and construction ideas</p>
            <p>• Assortment thinking</p>
            <p>• Commercial context</p>
          </div>
        </section>

        {/* SUBSCRIPTION */}
        <section className="max-w-4xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Subscription Information
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            CI includes five free views. Full access requires a paid
            subscription.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Subscriptions are available monthly ($29) or annually ($290). Plans
            renew automatically and may be canceled at any time through your
            account settings.
          </p>
        </section>

        {/* WHAT YOU ARE PAYING FOR */}
        <section className="max-w-4xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            What You Are Paying For
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Your subscription provides access to the Curatorial Intelligence
            system — including editorial moodboards, extracted color palettes,
            AI-assisted interpretation, and application-based design insight.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            You are not paying for image ownership. Images within CI are curated
            as editorial references. You are paying for access to the
            structured methodology, palette intelligence, and interpretive
            framework developed as Curatorial Intelligence™.
          </p>
        </section>

        {/* CONTACT */}
        <section className="max-w-4xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Contact
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
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

        {/* BACK BUTTON */}
        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center px-6 text-[11px] uppercase tracking-[0.12em] border border-neutral-300 text-neutral-600"
            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}