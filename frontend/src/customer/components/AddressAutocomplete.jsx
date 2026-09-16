import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper,
  Popper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Fade,
  ClickAwayListener,
  Tooltip,
} from "@mui/material";
import {
  LocationOn,
  Clear,
  MyLocation,
  NearMe,
  Public,
} from "@mui/icons-material";
import {
  searchOpenStreetMap,
  reverseGeocodeOpenStreetMap,
} from "../../utils/osmGeocoding";

export default function AddressAutocomplete({
  value = "",
  onChange,
  onSelectDetails,
  label = "Service Address",
  placeholder = "e.g. 2/30 Derbyshire Road, Leichhardt NSW 2040",
  disabled = false,
  error = false,
  helperText = "",
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [predictions, setPredictions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [anchorWidth, setAnchorWidth] = useState(null);

  const debounceTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Synchronize internal state when value prop changes externally
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Keep track of container width for Popper
  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      setAnchorWidth(containerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [updateWidth]);

  // Fetch recommendations with debouncing via OpenStreetMap
  const fetchSuggestions = useCallback(
    (query) => {
      const trimmed = query ? query.trim() : "";
      if (trimmed.length < 2) {
        setPredictions([]);
        setIsOpen(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      updateWidth();

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await searchOpenStreetMap(trimmed);
          setLoading(false);
          setPredictions(results);
          setIsOpen(results.length > 0);
          setSelectedIndex(-1);
        } catch (err) {
          console.warn("Address search error:", err);
          setLoading(false);
          setPredictions([]);
          setIsOpen(false);
        }
      }, 200);
    },
    [updateWidth]
  );

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    if (onChange) {
      onChange(text);
    }
    fetchSuggestions(text);
  };

  const handleSelect = (item) => {
    const selectedAddress = item.fullAddress || item.mainText;
    setInputValue(selectedAddress);
    setIsOpen(false);
    setSelectedIndex(-1);

    if (onChange) {
      onChange(selectedAddress);
    }

    if (onSelectDetails) {
      onSelectDetails({
        address: selectedAddress,
        placeId: item.placeId,
        coordinates: item.coordinates || null,
        source: "openstreetmap",
      });
    }
  };

  const handleClear = () => {
    setInputValue("");
    setPredictions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onChange) {
      onChange("");
    }
  };

  // Browser Geolocation ("Use Current Location" / Cab style via OpenStreetMap)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setIsOpen(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const result = await reverseGeocodeOpenStreetMap(latitude, longitude);
          setLocating(false);

          if (result && result.fullAddress) {
            setInputValue(result.fullAddress);
            if (onChange) onChange(result.fullAddress);
            if (onSelectDetails) {
              onSelectDetails({
                address: result.fullAddress,
                latitude,
                longitude,
                coordinates: result.coordinates,
                source: "openstreetmap",
              });
            }
          } else {
            const fallbackText = "Near Sydney NSW (Detected Location)";
            setInputValue(fallbackText);
            if (onChange) onChange(fallbackText);
          }
        } catch (err) {
          console.warn("Geolocation reverse error:", err);
          setLocating(false);
          alert("Could not retrieve street address from GPS. Please type manually.");
        }
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setLocating(false);
        alert("Location access was denied or unavailable. Please type your address.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Keyboard navigation (Arrow keys + Enter + Escape)
  const handleKeyDown = (e) => {
    if (!isOpen || predictions.length === 0) {
      if (e.key === "ArrowDown" && inputValue.length >= 2) {
        fetchSuggestions(inputValue);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < predictions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : predictions.length - 1
      );
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < predictions.length) {
        e.preventDefault();
        handleSelect(predictions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
        }}
      >
        <TextField
          label={label}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            updateWidth();
            if (inputValue.trim().length >= 2) {
              fetchSuggestions(inputValue);
            }
          }}
          disabled={disabled}
          error={error}
          helperText={helperText}
          autoComplete="off"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn
                    sx={{
                      color: inputValue ? "#2563EB" : "#94A3B8",
                      transition: "color 0.2s ease",
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {locating || loading ? (
                    <CircularProgress size={20} sx={{ color: "#2563EB", mr: 0.5 }} />
                  ) : null}

                  {inputValue && !disabled && (
                    <Tooltip title="Clear address">
                      <IconButton
                        size="small"
                        onClick={handleClear}
                        edge="end"
                        sx={{
                          color: "#94A3B8",
                          "&:hover": { color: "#475569" },
                          p: 0.5,
                          mr: 0.5,
                        }}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  <Tooltip title="Use Current Location (GPS)">
                    <IconButton
                      size="small"
                      onClick={handleUseCurrentLocation}
                      disabled={locating || disabled}
                      edge="end"
                      sx={{
                        color: "#2563EB",
                        backgroundColor: "rgba(37, 99, 235, 0.08)",
                        "&:hover": {
                          backgroundColor: "rgba(37, 99, 235, 0.16)",
                        },
                        p: 0.75,
                        borderRadius: "10px",
                      }}
                    >
                      <MyLocation fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            },
          }}
        />

        {/* OpenStreetMap Suggestion Dropdown rendered via Popper */}
        <Popper
          open={Boolean(isOpen && (predictions.length > 0 || locating))}
          anchorEl={containerRef.current}
          placement="bottom-start"
          style={{
            width: anchorWidth || containerRef.current?.clientWidth || 360,
            zIndex: 99999,
          }}
          transition
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={160}>
              <Paper
                elevation={16}
                sx={{
                  mt: 1,
                  borderRadius: "20px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow:
                    "0 24px 60px -10px rgba(15, 23, 42, 0.22), 0 4px 12px rgba(15, 23, 42, 0.08)",
                  overflow: "hidden",
                }}
              >
                {/* Quick GPS Action at Top */}
                <ListItemButton
                  onClick={handleUseCurrentLocation}
                  sx={{
                    py: 1.5,
                    px: 2.25,
                    backgroundColor: "rgba(37, 99, 235, 0.03)",
                    borderBottom: "1px solid #F1F5F9",
                    "&:hover": {
                      backgroundColor: "rgba(37, 99, 235, 0.08)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: "rgba(37, 99, 235, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#2563EB",
                      }}
                    >
                      <NearMe sx={{ fontSize: 18 }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "#1D4ED8" }}
                      >
                        Use Current Location
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: "0.75rem" }}
                      >
                        Auto-detect service address with GPS
                      </Typography>
                    }
                  />
                </ListItemButton>

                {/* List of OpenStreetMap Suggestions */}
                <List disablePadding sx={{ maxHeight: 280, overflowY: "auto" }}>
                  {predictions.map((item, idx) => {
                    const isSelected = selectedIndex === idx;

                    return (
                      <ListItem key={item.placeId || idx} disablePadding>
                        <ListItemButton
                          onClick={() => handleSelect(item)}
                          selected={isSelected}
                          sx={{
                            py: 1.4,
                            px: 2.25,
                            transition: "all 0.15s ease",
                            "&.Mui-selected": {
                              backgroundColor: "rgba(37, 99, 235, 0.09)",
                              "&:hover": {
                                backgroundColor: "rgba(37, 99, 235, 0.14)",
                              },
                            },
                            "&:hover": {
                              backgroundColor: "rgba(37, 99, 235, 0.05)",
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 42 }}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                backgroundColor: "#F1F5F9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#64748B",
                              }}
                            >
                              <LocationOn sx={{ fontSize: 18 }} />
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: "#0F172A",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                {item.mainText}
                              </Typography>
                            }
                            secondary={
                              item.secondaryText ? (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#64748B",
                                    display: "block",
                                    mt: 0.25,
                                    fontSize: "0.77rem",
                                  }}
                                >
                                  {item.secondaryText}
                                </Typography>
                              ) : null
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>

                <Divider sx={{ borderColor: "#F1F5F9" }} />

                {/* OpenStreetMap Attribution Footer */}
                <Box
                  sx={{
                    py: 1,
                    px: 2.25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                    }}
                  >
                    <Public sx={{ fontSize: 14, color: "#16A34A" }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      Powered by OpenStreetMap (100% Free)
                    </Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.68rem",
                      color: "#94A3B8",
                      fontWeight: 500,
                    }}
                  >
                    Press ↑↓ to navigate, ↵ to select
                  </Typography>
                </Box>
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
