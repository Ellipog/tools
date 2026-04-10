export type ReferenceMode = "website" | "book" | "journal" | "report";

export interface ReferenceData {
  authors: string;
  year: string;
  title: string;
  source: string; // Site Name, Journal Name, or Publisher
  url: string;
  mode: ReferenceMode;
  // New fields for APA 7 specificity
  volume?: string; // Journal
  issue?: string; // Journal
  pages?: string; // Journal/Book Chapter
  edition?: string; // Book
  reportNum?: string; // Report
}

export const generateAPA = (data: ReferenceData): string => {
  const {
    authors,
    year,
    title,
    source,
    url,
    mode,
    volume,
    issue,
    pages,
    edition,
    reportNum,
  } = data;

  const auth = authors || "Unknown Author";
  const yr = year ? `(${year})` : "(n.d.)";

  switch (mode) {
    case "journal":
      // Journal: Title is plain, Source (Journal Name) & Volume are italicized
      const journalInfo = [
        source ? `*${source}*` : "",
        volume ? `*${volume}*` : "",
        issue ? `(${issue})` : "",
        pages ? pages : "",
      ]
        .filter(Boolean)
        .join(", ");
      return `${auth}. ${yr}. ${title}. ${journalInfo}. ${url}`.trim();

    case "book":
      // Book: Title is italicized, Publisher is plain
      const ed = edition ? ` (${edition} ed.)` : "";
      return `${auth}. ${yr}. *${title}*${ed}. ${source}. ${url}`.trim();

    case "report":
      // Report: Title is italicized, include Report Number if exists
      const rep = reportNum ? ` (${reportNum})` : "";
      return `${auth}. ${yr}. *${title}*${rep}. ${source}. ${url}`.trim();

    default: // Website
      // Website: Title is italicized, Site Name is plain
      // If Author and Site Name (Source) are the same, omit Source.
      const siteName = source && source !== authors ? `${source}. ` : "";
      return `${auth}. ${yr}. *${title}*. ${siteName}${url}`.trim();
  }
};
