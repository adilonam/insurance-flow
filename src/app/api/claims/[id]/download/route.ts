import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getS3Client, getS3Bucket } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get claim and verify user has access
    const claim = await prisma.claim.findUnique({
      where: { id },
      select: { uploadedFileKey: true, uploadedFileName: true, userId: true },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (!claim.uploadedFileKey) {
      return NextResponse.json({ error: "No file uploaded for this claim" }, { status: 404 });
    }

    // Download file from S3/MinIO
    const s3Client = getS3Client();
    const bucket = getS3Bucket();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: claim.uploadedFileKey,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    // @ts-ignore - Body is a ReadableStream
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Get original filename from database, metadata, or extract from key
    const originalName = claim.uploadedFileName || response.Metadata?.originalName || claim.uploadedFileKey.split("/").pop() || "file";

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${originalName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
