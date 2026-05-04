"use client";

import { useState } from "react";

const previewImages = [
  {
    src: "/reports/ss-27/hero.jpg",
    alt: "SS 27 Trend Report Hero Preview",
  },
  {
    src: "/reports/ss-27/concept.jpg",
    alt: "SS 27 Trend Report Concept Page Preview",
  },
  {
    src: "/reports/ss-27/spread-3.jpg",
    alt: "SS 27 Trend Report Spread Preview",
  },
  {
    src: "/reports/ss-27/spread-2.jpg",
    alt: "SS 27 Trend Report Spread Preview",
  },
  {
  src: "/reports/ss-27/spread-1.jpg",
    alt: "SS 27 Trend Report Spread Preview",
  },
];

export default function ReportPage() {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl space-y-12">
        <section className="space-y-3">
          <h1
            className="text-[22px] uppercase tracking-[0.24em] text-neutral-900"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontWeight: 300,
            }}
          >
            Spring / Summer 2027 Trend Report
          </h1>
        </section>

        <section className="grid gap-10 md:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setActiveImage(previewImages[0].src)}
              className="block w-full cursor-zoom-in"
              aria-label="Enlarge hero preview"
            >
              <img
                src={previewImages[0].src}
                alt={previewImages[0].alt}
                className="aspect-[16/9] w-full border border-neutral-200 object-cover"
              />
            </button>

            <div className="mx-auto grid max-w-[78%] gap-5 sm:grid-cols-2">
              {previewImages.slice(1).map((image) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => setActiveImage(image.src)}
                  className="block w-full cursor-zoom-in"
                  aria-label="Enlarge spread preview"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="aspect-[16/9] w-full border border-neutral-200 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[12px] leading-[1.7] text-neutral-700">
                A visual seasonal report exploring consumer sentiment, macro
                direction, color, print, and pattern shaping the Spring Summer
                27 season.
              </p>

              <p className="text-[12px] leading-[1.7] text-neutral-700">
                Includes consumer behavior insights, macro trend direction,
                concept development, color palettes, and print and pattern
                stories.
              </p>

              <p
                className="text-[11px] uppercase tracking-[0.14em] text-neutral-500"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                85 Pages · Digital PDF
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <p
                className="text-[14px] text-neutral-900"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                $250
              </p>

              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/reports/checkout", {
                    method: "POST",
                  });

                  const data = await res.json();

                  if (data.url) {
                    window.location.href = data.url;
                  }
                }}
                className="w-full border border-black px-4 py-2 text-[11px] uppercase tracking-[0.16em] hover:bg-black hover:text-white"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                Purchase + Download
              </button>

              <p className="text-[11px] leading-[1.6] text-neutral-500">
                Includes a one-month Curatorial Intelligence access code, delivered with your report download.
              </p>
            </div>

            <p className="pt-4 text-[11px] text-neutral-500">
              Digital download for individual use. Team and studio licenses
              available by request.
            </p>
          </div>
        </section>
      </div>

      {activeImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-6 py-10"
          onClick={() => setActiveImage(null)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 text-[11px] uppercase tracking-[0.16em] text-neutral-500 hover:text-neutral-900"
            onClick={() => setActiveImage(null)}
          >
            Close
          </button>

          <img
            src={activeImage}
            alt="Expanded report preview"
            className="max-h-[88vh] max-w-[92vw] border border-neutral-200 object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </main>
  );
}