import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CalendarMonth,
  AccessTime,
  FlashOn,
  CheckCircle,
  ArrowForward,
  InfoOutlined,
} from "@mui/icons-material";

export default function FollowUpStep({
  message,
  value,
  onChange,
  onSubmit,
  submitting,
  error,
}) {
  const [selectedDateLabel, setSelectedDateLabel] = useState("");
  const [selectedTimeLabel, setSelectedTimeLabel] = useState("");
  const [customDate, setCustomDate] = useState("");

  // Dynamically generate upcoming days
  const upcomingDays = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      let label = "";
      if (i === 0) label = "Today";
      else if (i === 1) label = "Tomorrow";
      else {
        label = d.toLocaleDateString("en-US", { weekday: "short" });
      }

      const formatted = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const isoDate = d.toISOString().split("T")[0];

      days.push({
        id: isoDate,
        title: label,
        subtitle: formatted,
        isToday: i === 0,
        fullText: `${label} (${formatted})`,
      });
    }
    return days;
  }, []);

  const timeSlots = [
    {
      id: "morning",
      title: "Morning",
      time: "9:00 AM – 12:00 PM",
      icon: "☀️",
    },
    {
      id: "afternoon",
      title: "Afternoon",
      time: "1:00 PM – 5:00 PM",
      icon: "🌤️",
    },
    {
      id: "anytime",
      title: "Any Time",
      time: "First available window",
      icon: "⚡",
    },
  ];

  function handleSelectDate(day) {
    setSelectedDateLabel(day.title);
    setCustomDate(day.id);
    updateCombinedAnswer(day.id, day.title, selectedTimeLabel);
  }

  function handleSelectTime(slot) {
    setSelectedTimeLabel(slot.title);
    updateCombinedAnswer(customDate, selectedDateLabel, slot.title);
  }

  function handleCustomDateChange(e) {
    const newDate = e.target.value;
    setCustomDate(newDate);
    setSelectedDateLabel(newDate);
    updateCombinedAnswer(newDate, newDate, selectedTimeLabel);
  }

  function updateCombinedAnswer(dateVal, dateLabel, timeStr) {
    const dVal = dateVal || customDate || "Tomorrow";
    const dLbl = dateLabel || selectedDateLabel || dVal;
    const t = timeStr || selectedTimeLabel || "Morning";

    if (/^\d{4}-\d{2}-\d{2}$/.test(dVal)) {
      onChange(`${dLbl} ${dVal} ${t}`);
    } else {
      onChange(`${dLbl} ${t}`);
    }
  }

  function handleQuickFirstAvailable() {
    onChange("First available slot as soon as possible");
    // Directly submit
    setTimeout(() => {
      onSubmit();
    }, 50);
  }

  const hasSelection = Boolean(value.trim());

  return (
    <Box sx={{ maxWidth: 740, mx: "auto" }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: "28px",
          backgroundColor: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          boxShadow: "0 24px 70px -15px rgba(15, 23, 42, 0.1)",
        }}
      >
        {/* Header Badge */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <Chip
            icon={<FlashOn sx={{ fontSize: "16px !important", color: "#2563EB" }} />}
            label="Schedule Preference"
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: "0.74rem",
              backgroundColor: "rgba(37, 99, 235, 0.08)",
              color: "#2563EB",
              borderRadius: "8px",
            }}
          />
        </Stack>

        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "1.6rem", sm: "2.1rem" },
            fontWeight: 800,
            color: "#0F172A",
            letterSpacing: "-0.03em",
          }}
        >
          When should we come?
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mt: 0.75,
            mb: 3,
            lineHeight: 1.5,
            fontSize: "0.95rem",
          }}
        >
          {message ||
            "Please select your preferred date and time so we can assign an available certified technician."}
        </Typography>

        {/* 1-Click First Available Fast Track Banner */}
        <Box
          sx={{
            p: 2,
            mb: 3.5,
            borderRadius: "18px",
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(13, 148, 136, 0.06))",
            border: "1px solid rgba(37, 99, 235, 0.18)",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563EB, #0D9488)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FlashOn sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize="0.92rem" color="#0F172A">
                Need urgent help?
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Match with the earliest open slot instantly
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            size="small"
            onClick={handleQuickFirstAvailable}
            disabled={submitting}
            sx={{
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "0.82rem",
              py: 0.8,
              px: 2,
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
              flexShrink: 0,
            }}
          >
            ⚡ Book First Available Slot
          </Button>
        </Box>

        {/* SECTION 1: Select Day */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <CalendarMonth sx={{ fontSize: 18, color: "#64748B" }} />
            <Typography fontWeight={750} fontSize="0.9rem" color="#334155">
              1. Choose Preferred Day
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(5, 1fr)",
              },
              gap: 1.25,
            }}
          >
            {upcomingDays.map((day) => {
              const isSelected = selectedDateLabel === day.title;
              return (
                <Box
                  key={day.id}
                  onClick={() => handleSelectDate(day)}
                  sx={{
                    p: 1.5,
                    borderRadius: "14px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    backgroundColor: isSelected
                      ? "rgba(37, 99, 235, 0.08)"
                      : "rgba(255, 255, 255, 0.9)",
                    border: isSelected
                      ? "2px solid #2563EB"
                      : "1px solid rgba(226, 232, 240, 0.9)",
                    boxShadow: isSelected
                      ? "0 4px 14px rgba(37, 99, 235, 0.12)"
                      : "0 2px 6px rgba(15, 23, 42, 0.02)",
                    "&:hover": {
                      borderColor: "#2563EB",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Typography
                    fontWeight={800}
                    fontSize="0.9rem"
                    color={isSelected ? "#2563EB" : "#1E293B"}
                  >
                    {day.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color={isSelected ? "#2563EB" : "text.secondary"}
                    sx={{ display: "block", mt: 0.25 }}
                  >
                    {day.subtitle}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Optional specific date picker */}
          <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Or specific date:
            </Typography>
            <input
              type="date"
              value={customDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={handleCustomDateChange}
              style={{
                padding: "6px 12px",
                borderRadius: "10px",
                border: "1px solid #CBD5E1",
                fontSize: "0.82rem",
                fontFamily: "inherit",
                backgroundColor: "#FFFFFF",
                outline: "none",
                cursor: "pointer",
              }}
            />
          </Box>
        </Box>

        {/* SECTION 2: Select Time Window */}
        <Box sx={{ mb: 3.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <AccessTime sx={{ fontSize: 18, color: "#64748B" }} />
            <Typography fontWeight={750} fontSize="0.9rem" color="#334155">
              2. Choose Preferred Time
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)",
              },
              gap: 1.25,
            }}
          >
            {timeSlots.map((slot) => {
              const isSelected = selectedTimeLabel === slot.title;
              return (
                <Box
                  key={slot.id}
                  onClick={() => handleSelectTime(slot)}
                  sx={{
                    p: 1.75,
                    borderRadius: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    backgroundColor: isSelected
                      ? "rgba(37, 99, 235, 0.08)"
                      : "rgba(255, 255, 255, 0.9)",
                    border: isSelected
                      ? "2px solid #2563EB"
                      : "1px solid rgba(226, 232, 240, 0.9)",
                    boxShadow: isSelected
                      ? "0 4px 14px rgba(37, 99, 235, 0.12)"
                      : "0 2px 6px rgba(15, 23, 42, 0.02)",
                    "&:hover": {
                      borderColor: "#2563EB",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Typography fontSize="1.4rem" sx={{ lineHeight: 1 }}>
                    {slot.icon}
                  </Typography>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      fontWeight={800}
                      fontSize="0.88rem"
                      color={isSelected ? "#2563EB" : "#1E293B"}
                    >
                      {slot.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color={isSelected ? "#2563EB" : "text.secondary"}
                      sx={{ display: "block" }}
                    >
                      {slot.time}
                    </Typography>
                  </Box>
                  {isSelected && (
                    <CheckCircle sx={{ fontSize: 18, color: "#2563EB" }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* SECTION 3: Custom Details / Message Preview */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ display: "block", mb: 0.75 }}
          >
            Selected Details (or type instructions):
          </Typography>
          <TextField
            fullWidth
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. Tomorrow afternoon, or any time after 2pm..."
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                backgroundColor: "#FFFFFF",
              },
            }}
          />
        </Box>

        {/* Continue Action */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!hasSelection || submitting}
          onClick={onSubmit}
          endIcon={<ArrowForward />}
          sx={{
            py: 1.6,
            borderRadius: "16px",
            fontSize: "1rem",
            fontWeight: 750,
            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            boxShadow: "0 8px 25px rgba(37, 99, 235, 0.28)",
            "&:hover": {
              background: "linear-gradient(135deg, #1D4ED8, #1E40AF)",
              boxShadow: "0 10px 30px rgba(37, 99, 235, 0.38)",
            },
          }}
        >
          {submitting ? "Searching Available Technicians..." : "Find Available Appointments"}
        </Button>

        {error && (
          <Box
            sx={{
              mt: 2.5,
              p: 1.5,
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <InfoOutlined sx={{ fontSize: 18, color: "#EF4444" }} />
            <Typography variant="caption" color="error" fontWeight={600}>
              {error}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
