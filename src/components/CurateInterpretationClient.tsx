"use client";

import dynamic from "next/dynamic";

const CurateInterpretation = dynamic(() => import("./CurateInterpretation"), {
  ssr: false,
});

export default function CurateInterpretationClient(props: {
  q: string;
  assets: any[];
}) {
  return <CurateInterpretation {...props} />;
}
