"use client";

export default function ReportPurchaseButton({ slug }: { slug: string }) {
  return (
    <button
      type="button"
      className="w-full border border-black bg-black px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      onClick={async () => {
        try {
          const response = await fetch("/api/reports/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ slug }),
          });

          const data = await response.json();

          if (data.url) {
            window.location.href = data.url;
            return;
          }

          alert("Unable to start checkout.");
        } catch (err) {
          console.error(err);
          alert("Unable to start checkout.");
        }
      }}
    >
      Purchase + Download
    </button>
  );
}