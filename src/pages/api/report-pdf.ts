import type { NextApiRequest, NextApiResponse } from "next";
import PDFDocument from "pdfkit";

function fmtCurrency(n: number) {
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return `$${Math.round(n || 0).toLocaleString("en-CA")}`;
  }
}

function safeText(v: any, fallback = "-") {
  if (typeof v === "string" && v.trim()) return v.trim();
  return fallback;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { calc, estimates, topPrograms, checklist } = req.body || {};

    const companyName = safeText(calc?.companyName, "Your company");
    const location = safeText(calc?.locationLabel, "-");
    const sector = safeText(calc?.industryLabel, "-");
    const employees = safeText(calc?.employeesLabel, "-");
    const focus = safeText(calc?.focus, "-");

    const budget = Number(estimates?.budget || 0);
    const supportLow = Number(estimates?.totalSupportLow || 0);
    const supportHigh = Number(estimates?.totalSupportHigh || 0);
    const netLow = Number(estimates?.netLow || 0);
    const netHigh = Number(estimates?.netHigh || 0);
    const intensityLow = Number(estimates?.intensityLow || 0);
    const intensityHigh = Number(estimates?.intensityHigh || 0);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${companyName.replace(/[^a-z0-9]+/gi, "-")}-funding-report.pdf"`
    );

    const doc = new PDFDocument({ size: "A4", margin: 42 });
    doc.pipe(res);

    // Title
    doc.fontSize(18).text("Funding Summary Report", { underline: true });
    doc.moveDown(0.6);

    // Company block
    doc.fontSize(12).text(`Company: ${companyName}`);
    doc.text(`Location: ${location}`);
    doc.text(`Sector: ${sector}`);
    doc.text(`Employees: ${employees}`);
    doc.text(`Project focus: ${focus}`);
    doc.moveDown(0.8);

    // Highlights
    doc.fontSize(13).text("Highlights", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11).text(`Estimated eligible funding: ${fmtCurrency(supportLow)} – ${fmtCurrency(supportHigh)}`);
    doc.text(`Estimated net project cost after funding: ${fmtCurrency(netLow)} – ${fmtCurrency(netHigh)}`);
    doc.text(`Funding intensity estimate: ${intensityLow}% – ${intensityHigh}%`);
    doc.text(`Total project budget: ${fmtCurrency(budget)}`);
    doc.moveDown(0.8);

    // Top Programs
    doc.fontSize(13).text("Top Programs (prioritized)", { underline: true });
    doc.moveDown(0.4);

    const programs = Array.isArray(topPrograms) ? topPrograms : [];
    programs.slice(0, 3).forEach((p: any, idx: number) => {
      doc.fontSize(12).text(`${idx + 1}. ${safeText(p?.title)}`);
      doc.fontSize(10).fillColor("gray").text(`Type: ${safeText(p?.type)}`);
      doc.fillColor("black");
      doc.fontSize(10).text(`Estimated amount: ${fmtCurrency(Number(p?.amount?.low || 0))} – ${fmtCurrency(Number(p?.amount?.high || 0))}`);

      const cover = Array.isArray(p?.cover) ? p.cover : [];
      if (cover.length) {
        doc.moveDown(0.2);
        doc.fontSize(10).text("What it can cover:");
        cover.slice(0, 5).forEach((c: string) => doc.text(`• ${safeText(c, "")}`));
      }

      const conditions = Array.isArray(p?.conditions) ? p.conditions : [];
      if (conditions.length) {
        doc.moveDown(0.2);
        doc.fontSize(10).text("Key conditions:");
        conditions.slice(0, 6).forEach((c: string) => doc.text(`• ${safeText(c, "")}`));
      }

      doc.moveDown(0.7);
    });

    // Checklist
    doc.addPage();
    doc.fontSize(13).text("What we should do next (in order)", { underline: true });
    doc.moveDown(0.4);

    const steps = Array.isArray(checklist) ? checklist : [];
    steps.slice(0, 20).forEach((s: string, i: number) => {
      doc.fontSize(11).text(`${i + 1}. ${safeText(s, "")}`);
      doc.moveDown(0.15);
    });

    doc.moveDown(1);
    doc.fontSize(9).fillColor("gray").text(
      "Note: This report is an estimate based on typical eligibility patterns and public program rules. Final approval depends on full application review."
    );

    doc.end();
  } catch (e: any) {
    return res.status(500).json({ error: "Failed to generate PDF", details: e?.message || String(e) });
  }
}
