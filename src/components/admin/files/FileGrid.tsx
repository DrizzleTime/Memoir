"use client";

import { Card, Col, Row, Tag, Typography } from "antd";
import { getFileTypeIcon } from "@/components/admin/files/file-display";
import { RawImg } from "@/components/ui";
import { getBaseName, getFileExtension, isImageFile } from "@/lib/file-meta";
import type { UploadFileItem } from "@/types/files";

interface FileGridProps {
  files: UploadFileItem[];
  onPreview: (file: UploadFileItem) => void;
}

export function FileGrid({ files, onPreview }: FileGridProps) {
  return (
    <Row gutter={[16, 16]}>
      {files.map((file) => {
        const url = `/uploads/${file.relativePath}`;
        const baseName = getBaseName(file.relativePath);
        const displayName = file.originalName || baseName;
        const ext = getFileExtension(file.relativePath);
        const imageFile = isImageFile(file);

        const cover = imageFile && !file.isMissing ? (
          <div
            style={{
              height: 160,
              overflow: "hidden",
              background: "#fafafa",
            }}
          >
            <RawImg
              src={url}
              alt={displayName}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ) : (
          <div
            style={{
              height: 160,
              background: "#fafafa",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {getFileTypeIcon(file)}
            <div style={{ fontSize: 12, color: "#999", textTransform: "uppercase" }}>
              {ext || "-"}
            </div>
          </div>
        );

        return (
          <Col key={file.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
            <Card
              cover={cover}
              hoverable
              onClick={() => onPreview(file)}
              styles={{ body: { padding: 12 } }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <Typography.Text
                  style={{ fontWeight: 500, lineHeight: 1.4 }}
                  ellipsis={{ tooltip: displayName }}
                >
                  {displayName}
                </Typography.Text>
                <Tag color={file.isMissing ? "error" : "success"}>
                  {file.isMissing ? "缺失" : "正常"}
                </Tag>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
