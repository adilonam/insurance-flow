import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getS3Client, getS3Bucket } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// POST - Upload card statement
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const creditCardId = formData.get("creditCardId") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    if (!file || !creditCardId || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate file type - accept images and PDFs
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF and image files are allowed." }, { status: 400 });
    }

    // Get credit card to verify it exists
    const creditCard = await prisma.creditCard.findUnique({
      where: { id: creditCardId },
      include: {
        financialStep: {
          include: {
            claim: true,
          },
        },
      },
    });

    if (!creditCard) {
      return NextResponse.json({ error: "Credit card not found" }, { status: 404 });
    }

    // Verify the credit card belongs to this claim
    if (creditCard.financialStep.claimId !== id) {
      return NextResponse.json({ error: "Credit card does not belong to this claim" }, { status: 403 });
    }

    // Generate unique file key for claims/financial/...
    const fileExtension = file.name.split(".").pop();
    const randomId = randomBytes(16).toString("hex");
    const timestamp = Date.now();
    const fileKey = `claims/financial/${id}/${creditCardId}/${timestamp}-${randomId}.${fileExtension}`;

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
          creditCardId: creditCardId,
        },
      }),
    );

    // Create card statement record
    const statement = await prisma.cardStatement.create({
      data: {
        creditCardId: creditCardId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        fileKey: fileKey,
        fileName: file.name,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      statement,
      fileKey,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Error uploading card statement:", error);
    return NextResponse.json({ error: "Failed to upload card statement" }, { status: 500 });
  }
}

// DELETE - Delete card statement
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get("statementId");

    if (!statementId) {
      return NextResponse.json({ error: "Statement ID is required" }, { status: 400 });
    }

    // Get statement to verify it belongs to this claim
    const statement = await prisma.cardStatement.findUnique({
      where: { id: statementId },
      include: {
        creditCard: {
          include: {
            financialStep: true,
          },
        },
      },
    });

    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    }

    if (statement.creditCard.financialStep.claimId !== id) {
      return NextResponse.json({ error: "Statement does not belong to this claim" }, { status: 403 });
    }

    // TODO: Delete file from S3/MinIO if needed
    // For now, just delete the record

    await prisma.cardStatement.delete({
      where: { id: statementId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting card statement:", error);
    return NextResponse.json({ error: "Failed to delete card statement" }, { status: 500 });
  }
}
