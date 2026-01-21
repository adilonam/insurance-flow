import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getS3Client, getS3Bucket } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

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
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("fileKey");
    const fileName = searchParams.get("fileName") || "statement";

    if (!fileKey) {
      return NextResponse.json({ error: "File key is required" }, { status: 400 });
    }

    // Verify the file belongs to this claim (fileKey should start with claims/financial/{id}/)
    if (!fileKey.startsWith(`claims/financial/${id}/`)) {
      return NextResponse.json({ error: "Invalid file access" }, { status: 403 });
    }

    // Download file from S3/MinIO
    const s3Client = getS3Client();
    const bucket = getS3Bucket();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
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

    // Get original filename from query param or extract from key
    const originalName = fileName || fileKey.split("/").pop() || "statement";

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${originalName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading bank statement:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
