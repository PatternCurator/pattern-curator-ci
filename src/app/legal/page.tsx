export const metadata = {
  title: "Legal",
};

export default function LegalPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Legal</h1>
        <p className="mt-3 text-sm text-neutral-600">
          This page contains the Terms and Conditions, Privacy Policy, Image Rights and Fair Use
          Disclaimer, DMCA Notice, and Enterprise Terms for Curatorial Intelligence.
        </p>

        <nav className="mt-6 border border-neutral-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-600">
            Sections
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a className="underline underline-offset-4" href="#terms">
                Terms and Conditions
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4" href="#privacy">
                Privacy Policy
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4" href="#image-rights">
                Image Rights and Fair Use
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4" href="#dmca">
                DMCA Notice
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4" href="#enterprise">
                Enterprise Terms Addendum
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* TERMS */}
      <section id="terms" className="scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">Terms and Conditions</h2>
        <p className="mt-2 text-xs text-neutral-600">
          Effective Date: March 2, 2026 · Last Updated: March 2, 2026
        </p>

        <div className="prose prose-neutral mt-6 max-w-none prose-headings:tracking-tight prose-a:underline prose-a:underline-offset-4">
          <p>
            These Terms and Conditions (the "Terms") govern your access to and use of the Curatorial
            Intelligence platform (the "Platform") operated by Pattern Curator LLC ("Company," "we,"
            "us," or "our"). By accessing or using the Platform, you agree to be bound by these
            Terms. If you do not agree, do not use the Platform.
          </p>

          <h3>1. Platform Description</h3>
          <p>
            Curatorial Intelligence ("CI") is a subscription-based visual research, cultural
            analysis, and design intelligence platform that provides curated references, editorial
            interpretation, and AI-supported tools for creative application. The Platform is
            provided for informational, research, and creative inspiration purposes only.
          </p>

          <h3>2. Intellectual Property</h3>
          <h4>2.1 Company Intellectual Property</h4>
          <p>
            The Platform and all original content created by the Company, including editorial
            commentary, written analysis, structure, organization, taxonomies, workflows, and
            methodology (including Curatorial Intelligence), are owned by the Company and protected
            by intellectual property laws. No rights are granted except as expressly set forth in
            these Terms.
          </p>

          <h4>2.2 Third Party Images and Materials</h4>
          <p>
            The Platform may display images, trademarks, brand names, logos, and other materials
            owned by third parties. The Company does not claim ownership of third-party content. All
            rights remain with their respective owners. Display of third-party materials does not
            imply endorsement, sponsorship, or affiliation.
          </p>

          <h4>2.3 Fair Use and Transformative Context</h4>
          <p>
            Third-party materials are presented in a curated, editorial, analytical, and
            transformative context for purposes of commentary, criticism, research, reporting, and
            education. The Platform does not sell, license, or distribute third-party content as
            standalone assets.
          </p>

          <h3>3. Takedown Policy</h3>
          <p>
            If you believe material on the Platform infringes your rights, submit a request to{" "}
            <a href="mailto:info@patterncurator.com">info@patterncurator.com</a> with (i) the URL of
            the material, (ii) identification of the work, (iii) proof of ownership or authority to
            act, and (iv) your contact information. We reserve the right to remove content at our
            discretion and without notice.
          </p>

          <h3>4. License to Users</h3>
          <p>
            Subject to compliance with these Terms, we grant you a limited, non-exclusive,
            non-transferable, revocable license to access and use the Platform for internal research
            and creative development purposes only.
          </p>

          <h3>5. Prohibited Uses</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Scrape, crawl, harvest, or extract data using automated tools</li>
            <li>Bulk download, mirror, archive, or systematically copy Platform content</li>
            <li>Rehost, republish, redistribute, or resell Platform content</li>
            <li>Share accounts or circumvent access controls</li>
            <li>
              Use Platform content, structure, organization, or analysis to train AI or machine
              learning systems without written permission
            </li>
            <li>Use the Platform to develop a competing product or dataset</li>
          </ul>

          <h3>6. Subscription Terms</h3>
          <p>
            Access fees are billed in advance and may renew automatically unless canceled.
            Fees are non-refundable except where required by law. We may change pricing and features
            with reasonable notice.
          </p>

          <h3>7. Beta Features</h3>
          <p>
            Some features may be offered as beta. Beta features may be modified or discontinued at
            any time and are provided without warranties.
          </p>

          <h3>8. Disclaimers</h3>
          <p>
            The Platform is provided "as is" and "as available." We disclaim all warranties,
            including merchantability, fitness for a particular purpose, and non-infringement. We do
            not warrant accuracy, completeness, or uninterrupted availability.
          </p>

          <h3>9. Limitation of Liability</h3>
          <p>
            To the maximum extent permitted by law, the Company is not liable for indirect,
            incidental, consequential, special, or punitive damages, or for lost profits or business
            interruption. Total liability will not exceed the fees paid by you in the twelve (12)
            months preceding the claim.
          </p>

          <h3>10. Indemnification</h3>
          <p>
            You agree to indemnify and hold harmless the Company from claims arising out of your
            misuse of the Platform or violation of these Terms.
          </p>

          <h3>11. Changes</h3>
          <p>
            We may update these Terms at any time. Continued use of the Platform constitutes
            acceptance of the updated Terms.
          </p>

          <h3>12. Contact</h3>
          <p>
            Pattern Curator LLC
            <br />
            P.O. Box 2266
            <br />
            Vineland, NJ 08360
            <br />
            <a href="mailto:info@patterncurator.com">info@patterncurator.com</a>
          </p>
        </div>
      </section>

      <hr className="my-12 border-neutral-200" />

      {/* PRIVACY */}
      <section id="privacy" className="scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">Privacy Policy</h2>
        <p className="mt-2 text-xs text-neutral-600">
          Effective Date: March 2, 2026 · Last Updated: March 2, 2026
        </p>

        <div className="prose prose-neutral mt-6 max-w-none prose-headings:tracking-tight prose-a:underline prose-a:underline-offset-4">
          <p>
            This Privacy Policy explains how Pattern Curator LLC ("Company," "we," "us," or "our")
            collects, uses, and protects information when you access or use Curatorial Intelligence
            (the "Platform").
          </p>

          <h3>1. Information We Collect</h3>
          <h4>1.1 Information You Provide</h4>
          <p>
            We may collect information you provide such as your name, email address, company name,
            and subscription or account details. Payment processing is handled by third-party
            payment processors. We do not store full payment card information on our servers.
          </p>

          <h4>1.2 Usage and Device Data</h4>
          <p>
            We may collect data such as IP address, browser and device type, pages viewed, feature
            usage, searches, and logs to operate, secure, and improve the Platform.
          </p>

          <h4>1.3 Cookies and Similar Technologies</h4>
          <p>
            We may use cookies and similar technologies for authentication, security, analytics, and
            performance. You can control cookies through your browser settings; some Platform
            features may not function properly without cookies.
          </p>

          <h3>2. How We Use Information</h3>
          <ul>
            <li>Provide and operate the Platform</li>
            <li>Authenticate users and manage accounts</li>
            <li>Process subscriptions and payments (via processors)</li>
            <li>Maintain security and prevent fraud, abuse, and scraping</li>
            <li>Improve features, performance, and user experience</li>
            <li>Communicate service updates and operational notices</li>
          </ul>

          <h3>3. Sharing of Information</h3>
          <p>
            We may share information with vendors and service providers that help us operate the
            Platform (for example: hosting, authentication, payment processing, analytics). We may
            also disclose information to comply with law, enforce our Terms, or protect rights and
            safety. We do not sell personal information.
          </p>

          <h3>4. Data Retention</h3>
          <p>
            We retain personal information as needed to provide the Platform, comply with legal
            obligations, resolve disputes, and enforce agreements. We may retain aggregated or
            de-identified data.
          </p>

          <h3>5. Security</h3>
          <p>
            We implement reasonable safeguards designed to protect information. No method of
            transmission or storage is perfectly secure, and we cannot guarantee absolute security.
          </p>

          <h3>6. Your Rights</h3>
          <p>
            Depending on your location, you may have rights to request access, correction, or
            deletion of your personal information. To submit a request, contact{" "}
            <a href="mailto:info@patterncurator.com">info@patterncurator.com</a>.
          </p>

          <h3>7. International Users</h3>
          <p>
            The Platform is operated from the United States. By using the Platform, you consent to
            the processing of information in the United States.
          </p>

          <h3>8. Changes to This Policy</h3>
          <p>
            We may update this Privacy Policy at any time. Continued use constitutes acceptance of
            changes.
          </p>

          <h3>9. Contact</h3>
          <p>
            Pattern Curator LLC
            <br />
            P.O. Box 2266
            <br />
            Vineland, NJ 08360
            <br />
            <a href="mailto:info@patterncurator.com">info@patterncurator.com</a>
          </p>
        </div>
      </section>

      <hr className="my-12 border-neutral-200" />

      {/* IMAGE RIGHTS */}
      <section id="image-rights" className="scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">Image Rights and Fair Use</h2>

        <div className="prose prose-neutral mt-6 max-w-none prose-headings:tracking-tight prose-a:underline prose-a:underline-offset-4">
          <p>
            Curatorial Intelligence is a research and cultural analysis platform. We do not claim
            ownership of third-party images, trademarks, brand names, logos, or other visual
            materials displayed on the Platform. All rights remain with their respective owners.
          </p>

          <h3>1. Purpose of Display</h3>
          <p>
            Materials are displayed for commentary, criticism, research, reporting, education, and
            transformative editorial analysis. The Platform does not sell, license, or distribute
            third-party content as standalone assets.
          </p>

          <h3>2. No Affiliation</h3>
          <p>
            Display of third-party materials does not imply endorsement, sponsorship, partnership,
            or affiliation unless expressly stated.
          </p>

          <h3>3. Attribution</h3>
          <p>
            Where possible, we provide source references. If attribution is incomplete or
            inaccurate, please contact{" "}
            <a href="mailto:info@patterncurator.com">info@patterncurator.com</a>.
          </p>

          <h3>4. Takedown Requests</h3>
          <p>
            If you are a rights holder and believe content should be removed, contact{" "}
            <a href="mailto:info@patterncurator.com">info@patterncurator.com</a> with the URL,
            identification of the work, proof of ownership, and your contact information. We may
            remove content at our discretion and without notice.
          </p>

          <h3>5. Removal at Discretion</h3>
          <p>
            Pattern Curator LLC reserves the right to remove any image or material from the Platform
            at any time, for any reason.
          </p>
        </div>
      </section>

      <hr className="my-12 border-neutral-200" />

      {/* DMCA */}
      <section id="dmca" className="scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">DMCA Notice</h2>

        <div className="prose prose-neutral mt-6 max-w-none prose-headings:tracking-tight prose-a:underline prose-a:underline-offset-4">
          <p>
            Pattern Curator LLC respects intellectual property rights and responds to properly
            submitted notices of alleged infringement in accordance with the Digital Millennium
            Copyright Act (DMCA).
          </p>

          <h3>1. Filing a DMCA Notice</h3>
          <p>
            To submit a notice, please email{" "}
            <a href="mailto:info@patterncurator.com">info@patterncurator.com</a> and include:
          </p>
          <ol>
            <li>Your physical or electronic signature</li>
            <li>Identification of the copyrighted work</li>
            <li>Identification of the material claimed to be infringing, including the URL</li>
            <li>Your contact information (name, address, phone number, email)</li>
            <li>
              A statement that you have a good faith belief the use is not authorized by the rights
              owner, its agent, or the law
            </li>
            <li>
              A statement under penalty of perjury that the information is accurate and you are the
              rights owner or authorized to act
            </li>
          </ol>

          <h3>2. Counter Notification</h3>
          <p>
            If you believe material was removed in error, you may submit a counter-notification to{" "}
            <a href="mailto:info@patterncurator.com">info@patterncurator.com</a> including your
            signature, identification of the removed material, a statement under penalty of perjury,
            and consent to jurisdiction as required by the DMCA.
          </p>

          <h3>3. Repeat Infringers</h3>
          <p>
            We reserve the right to restrict or terminate access for repeat infringers in
            appropriate circumstances.
          </p>

          <h3>4. DMCA Agent Contact</h3>
          <p>
            Pattern Curator LLC
            <br />
            P.O. Box 2266
            <br />
            Vineland, NJ 08360
            <br />
            <a href="mailto:info@patterncurator.com">info@patterncurator.com</a>
          </p>
        </div>
      </section>

      <hr className="my-12 border-neutral-200" />

      {/* ENTERPRISE */}
      <section id="enterprise" className="scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">Enterprise Terms Addendum</h2>

        <div className="prose prose-neutral mt-6 max-w-none prose-headings:tracking-tight prose-a:underline prose-a:underline-offset-4">
          <p>
            This Enterprise Terms Addendum supplements the Terms and Conditions and applies to
            enterprise or multi-seat access holders.
          </p>

          <h3>1. Scope of Enterprise License</h3>
          <p>
            Enterprise access grants internal company research access for authorized users within a
            single legal entity. It does not grant redistribution, resale, public republication, or
            database extraction rights unless explicitly agreed in a separate written agreement.
          </p>

          <h3>2. Internal Use Only</h3>
          <p>
            Enterprise users may not rehost Platform content, create mirrored libraries, distribute
            curated compilations externally, or export structured datasets.
          </p>

          <h3>3. AI Training Restriction</h3>
          <p>
            Enterprise users may not use Platform content, structure, organization, or analysis to
            train AI models, build datasets, or develop competing systems without written
            authorization from the Company.
          </p>

          <h3>4. Audit Rights</h3>
          <p>
            The Company reserves the right to audit usage in cases of suspected misuse or policy
            violations.
          </p>

          <h3>5. Contact</h3>
          <p>
            For enterprise terms questions, contact{" "}
            <a href="mailto:info@patterncurator.com">info@patterncurator.com</a>.
          </p>
        </div>
      </section>

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-600">
        <p>
          Pattern Curator LLC · P.O. Box 2266 · Vineland, NJ 08360 ·{" "}
          <a className="underline underline-offset-4" href="mailto:info@patterncurator.com">
            info@patterncurator.com
          </a>
        </p>
      </footer>
    </main>
  );
}