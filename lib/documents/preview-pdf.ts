import { readFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const SUPPORTED_TIFF_EXTENSIONS = new Set([".tif", ".tiff"]);

const getPublicFilePath = (assetUrl: string): string => {
  const normalized = assetUrl.startsWith("/") ? assetUrl : `/${assetUrl}`;
  const filePath = path.normalize(path.join(process.cwd(), "public", normalized));
  const publicRoot = path.normalize(path.join(process.cwd(), "public"));
  if (!filePath.startsWith(publicRoot)) {
    throw new Error("Invalid asset path.");
  }
  return filePath;
};

const getFileExtension = (assetUrl: string): string => {
  const cleanUrl = assetUrl.split("?")[0]?.split("#")[0] ?? assetUrl;
  return path.extname(cleanUrl).toLowerCase();
};

export const isPdfAsset = (assetUrl: string): boolean =>
  getFileExtension(assetUrl) === ".pdf";

export const isTiffAsset = (assetUrl: string): boolean =>
  SUPPORTED_TIFF_EXTENSIONS.has(getFileExtension(assetUrl));

export const convertTiffAssetToPdf = async (assetUrl: string): Promise<Uint8Array> => {
  const tiffPath = getPublicFilePath(assetUrl);
  const tiffBuffer = await readFile(tiffPath);
  const metadata = await sharp(tiffBuffer, { pages: -1 }).metadata();
  const totalPages = Math.max(metadata.pages ?? 1, 1);

  const pdf = await PDFDocument.create();

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const pngBuffer = await sharp(tiffBuffer, { page: pageIndex })
      .png()
      .toBuffer();
    const image = await pdf.embedPng(pngBuffer);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return pdf.save();
};
