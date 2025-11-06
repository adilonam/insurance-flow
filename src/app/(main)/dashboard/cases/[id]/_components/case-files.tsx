"use client";

import { Download, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { caseFileSchema } from "../../_components/schema";

interface CaseFilesProps {
  files: z.infer<typeof caseFileSchema>[];
}

export function CaseFiles({ files }: CaseFilesProps) {
  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No files available for this status.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <File className="size-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-muted-foreground text-xs">Uploaded: {file.uploadedAt}</div>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={file.url} download>
                  <Download className="size-4" />
                  <span className="sr-only">Download {file.name}</span>
                </a>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

