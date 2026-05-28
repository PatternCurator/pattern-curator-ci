"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

type Props = {
  pdfUrl: string;
};

export default function ForecastPdfViewer({ pdfUrl }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    import("react-pdf").then(({ pdfjs }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      if (active) setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (!ready) {
    return (
      <div className="py-20 text-center text-sm text-neutral-500">
        Loading forecast…
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="py-20 text-center text-sm text-neutral-500">
            Loading forecast…
          </div>
        }
        error={
          <div className="py-20 text-center text-sm text-red-600">
            This forecast could not be loaded.
          </div>
        }
      >
        {Array.from(new Array(numPages), (_, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            width={1000}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="overflow-hidden border border-neutral-200 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
          />
        ))}
      </Document>
    </div>
  );
}