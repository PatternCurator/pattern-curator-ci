export default function ReportSuccessPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl space-y-4">
        <h1
          className="text-[22px] uppercase tracking-[0.24em] text-neutral-900"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 300,
          }}
        >
          Thank You
        </h1>

        <p className="max-w-2xl text-[12px] leading-[1.7] text-neutral-700">
          Your purchase was successful. A download link for your report will be sent to your email. Didn't receive? Check your spam folder or contact info@patterncurator.com
        </p>
      </div>
    </main>
  );
}