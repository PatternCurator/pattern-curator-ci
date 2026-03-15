import Link from "next/link";

const BRAND_GREY = "#5f6368";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-12">
        {/* HEADER */}
        <header className="max-w-3xl space-y-4">
          <div
            className="text-[20px] font-bold uppercase tracking-widest"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              color: BRAND_GREY,
            }}
          >
            About and Methodology
          </div>

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
        </header>

        {/* WHAT IS CI */}
        <section className="max-w-3xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            What is Curatorial Intelligence?
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Curatorial Intelligence combines a curated collection of editorial
            moodboards with an interpretation layer powered by AI.
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
        <section className="max-w-3xl space-y-6">
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
              <strong>1) Curate</strong>
              <br />A focused collection of editorial moodboards built and
              maintained with a strong point of view — selective, relevant, and
              designed to reduce noise.
            </p>

            <p>
              <strong>2) Interpret</strong>
              <br />
              Translate visual references into structured insight through
              Curatorial Intelligence notes, including directional context,
              design relevance, and broader creative meaning.
            </p>

            <p>
              <strong>3) Apply</strong>
              <br />
              Use Application Query to translate a board’s direction into
              specific product or category thinking, such as swim, lounge, knit
              tops, accessories, and more.
            </p>
          </div>
        </section>

        {/* IMAGE USAGE */}
        <section className="max-w-3xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Image Usage
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Images within CI are curated as editorial references selected to
            support context, methodology, and interpretation. They are
            presented as part of a visual research and analysis system, not as
            standalone downloadable assets or image ownership.
          </p>
        </section>

        {/* HOW TO USE */}
        <section className="max-w-3xl space-y-4">
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
              • Open an individual board to view Curatorial Intelligence notes
              and contextual interpretation.
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
        <section className="max-w-3xl space-y-4">
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
        <section className="max-w-3xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Subscription Information
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            CI includes five free views. Full access requires a paid subscription.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Subscriptions are available monthly ($12.99) or annually ($129).
            Plans renew automatically and may be canceled at any time through
            your account settings.
          </p>
        </section>

        {/* WHAT YOU ARE PAYING FOR */}
        <section className="max-w-3xl space-y-4">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            What You Are Paying For
          </h2>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            Your subscription provides access to the Curatorial Intelligence
            system — including editorial moodboards, AI-assisted
            interpretation, and application-based design insight.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            You are not paying for image ownership. Images within CI are curated
            as editorial references. You are paying for access to the
            structured methodology and interpretive framework developed as
            Curatorial Intelligence™.
          </p>
        </section>

        {/* CONTACT */}
        <section className="max-w-3xl space-y-4">
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
            className="inline-flex h-10 items-center justify-center px-8 text-xs uppercase tracking-[0.15em]"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              border: "1px solid #B8B9B6",
              color: BRAND_GREY,
              background: "#f4f4f4",
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}