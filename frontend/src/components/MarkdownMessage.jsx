import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Box } from "@mui/material";

export default function MarkdownMessage({ content, isUser = false }) {
  if (!content) return null;

  return (
    <Box
      sx={{
        fontSize: "0.95rem",
        lineHeight: 1.65,
        color: isUser ? "#FFFFFF" : "#0F172A",
        "& p": {
          m: 0,
          mb: 1,
          "&:last-child": { mb: 0 },
        },
        "& strong": {
          fontWeight: 700,
          color: isUser ? "#FFFFFF" : "#0F172A",
        },
        "& ul, & ol": {
          m: 0,
          mb: 1,
          pl: 2.5,
          "&:last-child": { mb: 0 },
        },
        "& li": {
          mb: 0.5,
          "&:last-child": { mb: 0 },
        },
        "& table": {
          width: "100%",
          my: 1.5,
          borderCollapse: "separate",
          borderSpacing: 0,
          borderRadius: "8px",
          overflow: "hidden",
          border: isUser ? "1px solid rgba(255,255,255,0.2)" : "1px solid #CBD5E1",
          fontSize: "0.85rem",
          display: "block",
          overflowX: "auto",
        },
        "& th": {
          backgroundColor: isUser ? "rgba(255,255,255,0.15)" : "#F1F5F9",
          color: isUser ? "#FFFFFF" : "#334155",
          fontWeight: 700,
          p: "8px 12px",
          textAlign: "left",
          borderBottom: isUser ? "1px solid rgba(255,255,255,0.2)" : "1px solid #CBD5E1",
          whiteSpace: "nowrap",
        },
        "& td": {
          p: "8px 12px",
          borderBottom: isUser ? "1px solid rgba(255,255,255,0.1)" : "1px solid #E2E8F0",
          color: isUser ? "#FFFFFF" : "#0F172A",
          whiteSpace: "nowrap",
        },
        "& tr:last-child td": {
          borderBottom: "none",
        },
        "& tr:hover td": {
          backgroundColor: isUser ? "rgba(255,255,255,0.08)" : "#F8FAFC",
        },
        "& code": {
          backgroundColor: isUser ? "rgba(255,255,255,0.2)" : "#F1F5F9",
          p: "2px 6px",
          borderRadius: "4px",
          fontSize: "0.85em",
          fontFamily: "monospace",
        },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </Box>
  );
}
