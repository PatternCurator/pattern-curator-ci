import Link from "next/link";

const BRAND_GREY = "#5f6368"; // darker grey for stronger hierarchy

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-12">
        {/* HEADER */}
        <header className="space-y-4 max-w-3xl">
          <div
            className="text-[20px] font-bold uppercase tracking-widest"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              color: BRAND_GREY,
            }}
          >
            About and Methodology
          </div>

          <p
            className="text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            Pattern Curator Curatorial Intelligence™ (CI) is a curated visual
            intelligence system designed to move designers from inspiration to
            application with clarity and intention.
          </p>

          <p
            className="text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            CI sits at the intersection of editorial direction and AI-assisted
            insight. It sharpens thinking without replacing it, supporting real
            creative decision-making through structure rather than automation.
          </p>
        </header>

        {/* WHAT IS CI */}
        <section className="space-y-4 max-w-3xl">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            What is Curatorial Intelligence?
          </h2>

          <p
            className="text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            Curatorial Intelligence combines an edited visual library with a
            structured interpretation layer. The library is intentionally curated,
            organized, and refined to support working designers. The intelligence
            layer is optional—activated when clarity, articulation, or directional
            framing is needed.
          </p>
        </section>

        {/* METHODOLOGY */}
        <section className="space-y-6 max-w-3xl">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Methodology
          </h2>

          <div className="space-y-4 text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            <p>
              <strong>1) Curate</strong><br />
              A focused visual library built and maintained with editorial
              standards—cohesive, relevant, and structured to reduce noise.
            </p>

            <p>
              <strong>2) Lens</strong><br />
              Refine by category (library, inspiration, moodboards, archive) to
              isolate signal and strengthen point of view.
            </p>

            <p>
              <strong>3) Interpret</strong><br />
              Translate visual signals into structured insight—direction, color
              strategy, surface application, and commercial context.
            </p>

            <p>
              <strong>4) Apply</strong><br />
              Use Product application query to translate curated direction into
              specific product categories such as swim, lounge, knit tops,
              accessories, and more.
            </p>
          </div>
        </section>

        {/* IMAGE USAGE */}
        <section className="space-y-4 max-w-3xl">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Image Usage
          </h2>

          <p
            className="text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            Images within CI are curated as editorial references. They function
            as visual signals within a structured intelligence system and are
            selected to support context, methodology, and interpretation. They
            are not standalone downloadable assets.
          </p>
        </section>

        {/* HOW TO USE */}
        <section className="space-y-4 max-w-3xl">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            How to Use CI
          </h2>

          <div className="space-y-2 text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            <p>• Begin broad within the library to identify visual signals.</p>
            <p>• Refine through inspiration and moodboards to build cohesion.</p>
            <p>• Generate interpretation when articulation or clarity is needed.</p>
            <p>• Use Product application query to translate direction into product-level thinking.</p>
          </div>
        </section>

        {/* PRODUCT APPLICATION */}
        <section className="space-y-4 max-w-3xl">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Product Application Query
          </h2>

          <p
            className="text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            Product application query extends CI from visual inspiration into
            applied product direction.
          </p>

          <div className="space-y-2 text-sm leading-relaxed" style={{ color: BRAND_GREY }}>
            <p>Enter a category such as swim, lounge, knit tops, or accessories to receive structured insight through the Pattern Curator lens:</p>
            <p>• Direction translation</p>
            <p>• Color strategy</p>
            <p>• Print and surface application</p>
            <p>• Fabric and construction</p>
            <p>• Assortment strategy</p>
            <p>• Commercial read</p>
          </div>
        </section>

        {/* SUBSCRIPTION */}
        <section className="space-y-4 max-w-3xl">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Subscription Information
          </h2>

          <p
            className="text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            CI includes a five-search free allowance. Full access requires a paid
            subscription.
          </p>

          <p
            className="text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            Subscriptions are available monthly ($85) or annually ($850). Plans
            renew automatically. Cancellations require 30 days written notice via
            email. No refunds are offered.
          </p>
        </section>

        {/* WHAT YOU ARE PAYING FOR */}
        <section className="space-y-4 max-w-3xl">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            What You Are Paying For
          </h2>

          <p
            className="text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            Your subscription provides full access to the curated library,
            inspiration reports, moodboards, and AI-assisted interpretation layers.
          </p>

          <p
            className="text-sm leading-relaxed"
            style={{ color: BRAND_GREY }}
          >
            You are not paying for image ownership. Images curated within CI are
            sourced as editorial references. You are paying for the structured
            system and methodology developed and trademarked as Curatorial
            Intelligence™.
          </p>
        </section>

        {/* CONTACT */}
        <section className="space-y-4 max-w-3xl">
          <h2
            className="text-[15px] font-bold uppercase tracking-wide"
            style={{ color: BRAND_GREY }}
          >
            Contact
          </h2>

          <p
            className="text-sm leading-relaxed"
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

        {/* BACK BUTTON */}
        <div className="pt-6">
          <Link
            href="/"
            className="h-10 px-8 inline-flex items-center justify-center text-xs uppercase tracking-[0.15em]"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              border: "1px solid #B8B9B6",
              color: BRAND_GREY,
              background: "#f4f4f4",
            }}
          >
            Back to Library
          </Link>
        </div>
      </div>
    </main>
  );
}