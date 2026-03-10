'use client';

import { useLanguage } from '../contexts/LanguageContext';
import type { LegalDocKey } from '../lib/legal-content';
import { legalDocuments } from '../lib/legal-content';

interface LegalDocumentPageProps {
  doc: LegalDocKey;
}

export default function LegalDocumentPage({ doc }: LegalDocumentPageProps) {
  const { language } = useLanguage();
  const document = legalDocuments[language][doc];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">{document.title}</h1>
        <p className="text-sm text-neutral-400">
          {document.effectiveDateLabel}: {document.effectiveDate}
        </p>
        <p className="text-neutral-200">{document.intro}</p>
      </header>

      <div className="space-y-6">
        {document.sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-neutral-300 leading-7">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
