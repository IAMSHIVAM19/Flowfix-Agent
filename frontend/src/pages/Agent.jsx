import { useState, useRef, useEffect } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AutoAwesome,
  Build,
  CheckCircle,
  ContentCopy,
  Delete,
  ExpandMore,
  History,
  Lightbulb,
  Person,
  Send,
  SmartToy,
  WaterDrop,
} from "@mui/icons-material";

import PageHeader from "../components/PageHeader";
import MarkdownMessage from "../components/MarkdownMessage";
import { runAgentOperation } from "../services/api";

const starterPrompts = [
  {
    title: "Burst Pipe Specialists",
    prompt: "Which technicians are certified to handle emergency burst pipes or leak investigations?",
  },
  {
    title: "Check Technician Availability",
    prompt: "Check Alex and Sarah's open availability slots for appointments.",
  },
  {
    title: "Customer Lookup",
    prompt: "Find the customer associated with phone number 0417222090 and summarize their account.",
  },
  {
    title: "High Urgency Requests",
    prompt: "What are the actionable service requests that need immediate dispatcher triage?",
  },
];

function Agent() {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "agent",
      text: "Hello! I am your FlowFix AI Operations Assistant. You can ask me to look up customer records, check technician schedules, or evaluate dispatch availability. What would you like to inspect?",
      toolCalls: [],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function handleSend(promptText = null) {
    const textToSend = (promptText || inputMessage).trim();
    if (!textToSend || loading) return;

    const userMessageId = Date.now().toString();
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        sender: "user",
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];

    setMessages(newMessages);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await runAgentOperation(textToSend);

      setMessages([
        ...newMessages,
        {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: response?.message || "I have processed your request.",
          status: response?.status,
          toolCalls: response?.tool_calls || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: `Error contacting agent: ${error.message || "Operation failed."}`,
          isError: true,
          toolCalls: [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClearChat() {
    setMessages([
      {
        id: "welcome",
        sender: "agent",
        text: "Conversation cleared. How can I assist your dispatch operations?",
        toolCalls: [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      <PageHeader
        title="FlowFix AI Copilot"
        description="Conversational operations assistant with direct tool execution across schedules and customer records."
        badge={
          <Chip
            icon={<AutoAwesome sx={{ fontSize: "14px !important", color: "#2563EB !important" }} />}
            label="Agent Active"
            size="small"
            sx={{ fontWeight: 750, backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}
          />
        }
        action={
          <Button
            size="small"
            variant="outlined"
            startIcon={<Delete />}
            onClick={handleClearChat}
            sx={{ borderRadius: "10px", borderColor: "#E2E8F0" }}
          >
            Clear Conversation
          </Button>
        }
      />

      {/* Suggested Starter Chips */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <Lightbulb sx={{ fontSize: 18, color: "#F59E0B" }} />
          <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Suggested Operations Inquiries:
          </Typography>
        </Stack>

        <Grid container spacing={1.5}>
          {starterPrompts.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6 }}>
              <Box
                onClick={() => handleSend(item.prompt)}
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: "#3B82F6",
                    backgroundColor: "rgba(37, 99, 235, 0.03)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
                  },
                }}
              >
                <Typography variant="subtitle2" fontWeight={750} color="#2563EB" sx={{ fontSize: "0.82rem" }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                  "{item.prompt}"
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Conversation Window */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: "20px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 520,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.06)",
        }}
      >
        {/* Messages Stream */}
        <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto", maxHeight: 560 }}>
          <Stack spacing={3}>
            {messages.map((msg) => {
              const isUser = msg.sender === "user";

              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ maxWidth: isUser ? "80%" : "90%" }}>
                    {!isUser && (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #2563EB, #0D9488)",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)",
                        }}
                      >
                        <SmartToy sx={{ fontSize: 20 }} />
                      </Box>
                    )}

                    <Box>
                      {/* Message Bubble */}
                      <Box
                        sx={{
                          p: 2.25,
                          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          backgroundColor: isUser ? "#2563EB" : msg.isError ? "#FEF2F2" : "#F8FAFC",
                          color: isUser ? "#FFFFFF" : msg.isError ? "#991B1B" : "#0F172A",
                          border: isUser ? "none" : msg.isError ? "1px solid #FCA5A5" : "1px solid #E2E8F0",
                          boxShadow: isUser
                            ? "0 4px 14px rgba(37, 99, 235, 0.25)"
                            : "0 1px 3px rgba(15, 23, 42, 0.04)",
                        }}
                      >
                        <MarkdownMessage content={msg.text} isUser={isUser} />
                      </Box>

                      {/* Tool Call Activity Cards */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <Box sx={{ mt: 1.5 }}>
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Build sx={{ fontSize: 14, color: "#64748B" }} />
                              <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Tool Executions ({msg.toolCalls.length})
                              </Typography>
                            </Stack>

                            {msg.toolCalls.map((tool, idx) => (
                              <Accordion
                                key={idx}
                                disableGutters
                                elevation={0}
                                sx={{
                                  borderRadius: "12px !important",
                                  border: "1px solid #E2E8F0",
                                  backgroundColor: "#F8FAFC",
                                  "&:before": { display: "none" },
                                }}
                              >
                                <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 42, py: 0 }}>
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Chip
                                      label={tool.name || tool.tool_name || "tool_call"}
                                      size="small"
                                      sx={{
                                        fontFamily: "monospace",
                                        fontWeight: 700,
                                        fontSize: "0.72rem",
                                        backgroundColor: "rgba(37, 99, 235, 0.1)",
                                        color: "#2563EB",
                                      }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      Executed successfully
                                    </Typography>
                                  </Stack>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0 }}>
                                  <Box
                                    component="pre"
                                    sx={{
                                      p: 1.5,
                                      borderRadius: "8px",
                                      backgroundColor: "#0F172A",
                                      color: "#38BDF8",
                                      fontSize: "0.75rem",
                                      overflowX: "auto",
                                      m: 0,
                                    }}
                                  >
                                    {JSON.stringify(tool, null, 2)}
                                  </Box>
                                </AccordionDetails>
                              </Accordion>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", textAlign: isUser ? "right" : "left" }}>
                        {msg.timestamp}
                      </Typography>
                    </Box>

                    {isUser && (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          backgroundColor: "#0F172A",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Person sx={{ fontSize: 20 }} />
                      </Box>
                    )}
                  </Stack>
                </Box>
              );
            })}

            {/* Thinking / Loading indicator */}
            {loading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #2563EB, #0D9488)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SmartToy sx={{ fontSize: 20 }} />
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "18px 18px 18px 4px",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <CircularProgress size={16} color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Consulting database tools & evaluating schedule options...
                  </Typography>
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Stack>
        </Box>

        <Divider />

        {/* Input Bar */}
        <Box sx={{ p: 2, backgroundColor: "#FFFFFF" }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask FlowFix AI anything about technician dispatch, schedule windows, or customers..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      color="primary"
                      disabled={!inputMessage.trim() || loading}
                      onClick={() => handleSend()}
                      sx={{
                        backgroundColor: inputMessage.trim() && !loading ? "#2563EB" : "transparent",
                        color: inputMessage.trim() && !loading ? "#FFFFFF" : "#94A3B8",
                        "&:hover": {
                          backgroundColor: "#1D4ED8",
                        },
                      }}
                    >
                      <Send fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "right" }}>
            Press Enter to submit • Shift+Enter for new line
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default Agent;
