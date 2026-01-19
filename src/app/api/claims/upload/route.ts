import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getS3Client, getS3Bucket } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const claimId = formData.get("claimId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only CSV and Excel files are allowed." }, { status: 400 });
    }

    // Generate unique file key
    const fileExtension = file.name.split(".").pop();
    const randomId = randomBytes(16).toString("hex");
    const timestamp = Date.now();
    const fileKey = claimId 
      ? `claims/${claimId}/${randomId}.${fileExtension}`
      : `claims/pending/${timestamp}-${randomId}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3/MinIO
    const s3Client = getS3Client();
    const bucket = getS3Bucket();

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedBy: session.user?.id || "unknown",
        },
      }),
    );

    // If claimId is provided, update the claim with the file key and original filename
    // Otherwise, the file key will be associated when the claim is created
    if (claimId) {
      try {
        await prisma.claim.update({
          where: { id: claimId },
          data: { 
            uploadedFileKey: fileKey,
            uploadedFileName: file.name,
          },
        });
      } catch (error) {
        console.error("Error associating file with claim:", error);
        // Continue anyway - file is uploaded, can be associated later
      }
    }

    return NextResponse.json({
      success: true,
      fileKey,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
