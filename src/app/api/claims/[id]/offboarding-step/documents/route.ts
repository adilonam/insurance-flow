import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getS3Client, getS3Bucket } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// POST - Upload offboarding document
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file || !documentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate file type - accept images and PDFs
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF and image files are allowed." }, { status: 400 });
    }

    // Check if claim exists
    const claim = await prisma.claim.findUnique({
      where: { id },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Find or create offboarding step
    let offboardingStep = await prisma.offboardingStep.findUnique({
      where: { claimId: id },
    });

    if (!offboardingStep) {
      offboardingStep = await prisma.offboardingStep.create({
        data: {
          claimId: id,
        },
      });
    }

    // Generate unique file key for claims/os-docs/...
    const fileExtension = file.name.split(".").pop();
    const randomId = randomBytes(16).toString("hex");
    const timestamp = Date.now();
    const fileKey = `claims/os-docs/${id}/${documentType}/${timestamp}-${randomId}.${fileExtension}`;

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
          documentType: documentType,
        },
      }),
    );

    // Create or update document record
    const existingDoc = await prisma.offboardingDocument.findFirst({
      where: {
        offboardingStepId: offboardingStep.id,
        documentType: documentType,
      },
    });

    let document;
    if (existingDoc) {
      document = await prisma.offboardingDocument.update({
        where: { id: existingDoc.id },
        data: {
          fileKey: fileKey,
          fileName: file.name,
          uploadedAt: new Date(),
          isExcluded: false,
          excludedAt: null,
        },
      });
    } else {
      document = await prisma.offboardingDocument.create({
        data: {
          offboardingStepId: offboardingStep.id,
          documentType: documentType,
          fileKey: fileKey,
          fileName: file.name,
          uploadedAt: new Date(),
          isExcluded: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      document,
      fileKey,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Error uploading offboarding document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

// PUT - Update document (exclude/unexclude)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { documentType, isExcluded } = body;

    if (!documentType || typeof isExcluded !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find offboarding step
    const offboardingStep = await prisma.offboardingStep.findUnique({
      where: { claimId: id },
    });

    if (!offboardingStep) {
      return NextResponse.json({ error: "Offboarding step not found" }, { status: 404 });
    }

    // Find or create document
    let document = await prisma.offboardingDocument.findFirst({
      where: {
        offboardingStepId: offboardingStep.id,
        documentType: documentType,
      },
    });

    if (!document) {
      document = await prisma.offboardingDocument.create({
        data: {
          offboardingStepId: offboardingStep.id,
          documentType: documentType,
          isExcluded: isExcluded,
          excludedAt: isExcluded ? new Date() : null,
        },
      });
    } else {
      document = await prisma.offboardingDocument.update({
        where: { id: document.id },
        data: {
          isExcluded: isExcluded,
          excludedAt: isExcluded ? new Date() : null,
        },
      });
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

// DELETE - Delete document
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    // Get document to verify it belongs to this claim
    const document = await prisma.offboardingDocument.findUnique({
      where: { id: documentId },
      include: {
        offboardingStep: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.offboardingStep.claimId !== id) {
      return NextResponse.json({ error: "Document does not belong to this claim" }, { status: 403 });
    }

    // TODO: Delete file from S3/MinIO if needed
    // For now, just delete the record
    await prisma.offboardingDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
