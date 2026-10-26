export interface LegalHeading {
  id: string;
  title: string;
  level: number;
}

export interface LegalDocument {
  title: string;
  updated: string;
  updatedISO: string;
  sourceUrl: string;
  sourceSha256: string;
  translationSha256?: string;
  headings: LegalHeading[];
  html: string;
}

export type LegalDocuments = Record<string, LegalDocument>;
