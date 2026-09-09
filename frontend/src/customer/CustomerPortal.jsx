import {
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  WaterDrop,
  VerifiedUser,
} from "@mui/icons-material";

import PortalShell from "./components/PortalShell";
import ProgressIndicator from "./components/ProgressIndicator";
import IssueStep from "./components/IssueStep";
import DetailsStep from "./components/DetailsStep";
import FollowUpStep from "./components/FollowUpStep";
import UnderstandingStep from "./components/UnderstandingStep";

import AppointmentStep from "./components/AppointmentStep";
import NoAvailabilityStep from "./components/NoAvailabilityStep";
import ConfirmationStep from "./components/ConfirmationStep";
import AnimatedStep from "./components/AnimatedStep";

import useCustomerFlow from "./hooks/useCustomerFlow";

import {
  createCustomerRequest,
  provideRequestInformation,
  confirmCustomerRequest,
  confirmCustomer,
} from "../services/api";


function CustomerPortal() {
  const {
    currentStep,

    issue,
    setIssue,

    customerDetails,
    setCustomerDetails,

    requestResult,
    setRequestResult,

    followUpAnswer,
    setFollowUpAnswer,

    selectedAppointment,
    setSelectedAppointment,

    submitting,
    setSubmitting,

    confirming,
    setConfirming,

    confirmingCustomer,
    setConfirmingCustomer,

    error,
    setError,

    nextStep,
    previousStep,
    resetFlow,
  } = useCustomerFlow();


  function handleIssueContinue() {
    if (issue.trim().length < 5) {
      return;
    }

    nextStep();
  }


  async function handleDetailsContinue() {
    if (
      customerDetails.name.trim().length < 2 ||
      customerDetails.phone.trim().length < 8 ||
      customerDetails.address.trim().length < 3
    ) {
      return;
    }

    setError("");
    setRequestResult(null);
    setFollowUpAnswer("");
    setSelectedAppointment(null);
    setSubmitting(true);

    // Move to the AI processing screen immediately.
    nextStep();

    try {
      const requestPromise =
        createCustomerRequest(
          customerDetails.name.trim(),
          customerDetails.phone.trim(),
          customerDetails.address.trim(),
          issue.trim()
        );

      // Make sure the AI-processing screen is
      // visible for at least 1.5 seconds.
      const minimumDisplayTime =
        new Promise((resolve) => {
          setTimeout(resolve, 1500);
        });

      const [result] =
        await Promise.all([
          requestPromise,
          minimumDisplayTime,
        ]);

      console.log(
        "FlowFix API response:",
        result
      );

      setRequestResult(result);

    } catch (err) {
      console.error(
        "Customer request failed:",
        err
      );

      setError(
        err.message ||
          "We couldn't process your request."
      );
    } finally {
      setSubmitting(false);
    }
  }


  async function handleCustomerConfirmation() {
    if (!requestResult?.request_id) {
      return;
    }

    setError("");
    setConfirmingCustomer(true);

    try {
      const result =
        await confirmCustomer(
          requestResult.request_id,
          customerDetails.name.trim(),
          customerDetails.phone.trim(),
          customerDetails.address.trim()
        );

      console.log(
        "Customer confirmation response:",
        result
      );

      setRequestResult(result);

    } catch (err) {
      console.error(
        "Customer confirmation failed:",
        err
      );

      setError(
        err.message ||
          "We couldn't confirm your customer details."
      );
    } finally {
      setConfirmingCustomer(false);
    }
  }


  async function handleFollowUpSubmit() {
    const answer = followUpAnswer.trim();

    if (
      !requestResult?.request_id ||
      answer.length < 2
    ) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const result =
        await provideRequestInformation(
          requestResult.request_id,
          answer
        );

      console.log(
        "FlowFix follow-up response:",
        result
      );

      setRequestResult(result);
      setFollowUpAnswer("");

    } catch (err) {
      console.error(
        "Follow-up submission failed:",
        err
      );

      setError(
        err.message ||
          "We couldn't process your answer."
      );
    } finally {
      setSubmitting(false);
    }
  }


  async function handleConfirmAppointment() {
    if (
      !requestResult?.request_id ||
      !selectedAppointment
    ) {
      return;
    }

    setError("");
    setConfirming(true);

    try {
      const result =
        await confirmCustomerRequest(
          requestResult.request_id,
          selectedAppointment.option_id
        );

      setRequestResult(result);

      nextStep();

    } catch (err) {
      console.error(
        "Appointment confirmation failed:",
        err
      );

      setError(
        err.message ||
          "We couldn't confirm that appointment."
      );
    } finally {
      setConfirming(false);
    }
  }


  function handleTryAgain() {
    setRequestResult(null);
    setFollowUpAnswer("");
    setSelectedAppointment(null);
    setError("");

    previousStep();
    previousStep();
  }

  function handleEditCustomerDetails() {
    setRequestResult(null);
    setError("");
    previousStep();
  }


  const appointmentOptions =
    requestResult?.appointment_options || [];

  const noAvailability =
    requestResult?.status ===
    "no_availability";

  const awaitingCustomerConfirmation =
    requestResult?.status ===
    "awaiting_customer_confirmation";


  return (
    <PortalShell>
      <Box
        sx={{
          minHeight:
            "calc(100vh - 128px)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              mb: {
                xs: 3,
                md: 4,
              },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              p: 1.5,
              px: { xs: 2, sm: 2.5 },
              borderRadius: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.82)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(255, 255, 255, 0.9)",
              boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.06)",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #2563EB, #0D9488)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                <WaterDrop sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={850}
                  sx={{
                    letterSpacing: "-0.03em",
                    color: "#0F172A",
                    lineHeight: 1.1,
                    fontSize: "1.1rem",
                  }}
                >
                  FlowFix
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.72rem",
                  }}
                >
                  Customer Self-Serve Booking
                </Typography>
              </Box>
            </Stack>

            <Chip
              icon={<VerifiedUser sx={{ fontSize: "16px !important", color: "#10B981 !important" }} />}
              label="Instant Booking"
              size="small"
              sx={{
                borderRadius: 999,
                fontSize: "0.78rem",
                fontWeight: 700,
                py: 0.6,
                px: 1.25,
                borderColor: "rgba(16, 185, 129, 0.25)",
                color: "#065F46",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
              }}
            />
          </Box>


          {/* Progress */}
          <ProgressIndicator
            currentStep={currentStep}
          />


          {/* Animated workflow content */}
          <AnimatedStep
            step={currentStep}
          >
            {/* STEP 1 */}
            {currentStep === 1 && (
              <IssueStep
                value={issue}
                onChange={setIssue}
                onContinue={
                  handleIssueContinue
                }
              />
            )}


            {/* STEP 2 */}
            {currentStep === 2 && (
              <DetailsStep
                details={customerDetails}
                onChange={
                  setCustomerDetails
                }
                onContinue={
                  handleDetailsContinue
                }
                onBack={previousStep}
              />
            )}


            {/* STEP 3 */}
            {currentStep === 3 && (
              <>
                {/* AI PROCESSING */}
                {submitting && (
                  <UnderstandingStep
                    error={error}
                  />
                )}

                {/* REQUEST ERROR */}
                {!submitting && error && !requestResult && (
                  <Box
                    sx={{
                      maxWidth: 620,
                      mx: "auto",
                      textAlign: "center",
                      p: 4,
                      borderRadius: "24px",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      color="error.main"
                      gutterBottom
                    >
                      Something went wrong
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ mb: 3 }}
                    >
                      {error}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={previousStep}
                      sx={{ borderRadius: "14px", fontWeight: 700 }}
                    >
                      Back to Edit Details
                    </Button>
                  </Box>
                )}



                {/* CUSTOMER IDENTITY CONFIRMATION */}
                {!submitting &&
                  awaitingCustomerConfirmation && (
                    <Box
                      sx={{
                        maxWidth: 720,
                        mx: "auto",
                      }}
                    >
                      <Box
                        sx={{
                          p: {
                            xs: 2.5,
                            sm: 4,
                          },
                          borderRadius: "24px",
                          backgroundColor:
                            "rgba(255,255,255,0.82)",
                          border:
                            "1px solid rgba(255,255,255,0.75)",
                          backdropFilter:
                            "blur(18px)",
                          boxShadow:
                            "0 20px 60px rgba(15,23,42,0.08)",
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            fontSize: {
                              xs: "1.7rem",
                              sm: "2.2rem",
                            },
                            fontWeight: 750,
                          }}
                        >
                          Let’s confirm your details.
                        </Typography>

                        <Typography
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            mb: 3,
                          }}
                        >
                          {requestResult.message}
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gap: 1.5,
                            mb: 3,
                          }}
                        >
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: "16px",
                              backgroundColor:
                                "rgba(15,23,42,0.04)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Name
                            </Typography>

                            <Typography
                              fontWeight={700}
                            >
                              {
                                customerDetails.name
                              }
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              p: 2,
                              borderRadius: "16px",
                              backgroundColor:
                                "rgba(15,23,42,0.04)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Phone
                            </Typography>

                            <Typography
                              fontWeight={700}
                            >
                              {
                                customerDetails.phone
                              }
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              p: 2,
                              borderRadius: "16px",
                              backgroundColor:
                                "rgba(15,23,42,0.04)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Address
                            </Typography>

                            <Typography
                              fontWeight={700}
                            >
                              {
                                customerDetails.address
                              }
                            </Typography>
                          </Box>
                        </Box>

                        <Stack spacing={1.5} sx={{ mt: 1 }}>
                          <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            sx={{
                              borderRadius: "15px",
                              minHeight: 52,
                            }}
                            disabled={
                              confirmingCustomer
                            }
                            onClick={
                              handleCustomerConfirmation
                            }
                          >
                            {confirmingCustomer
                              ? "Confirming..."
                              : "Yes, that's me — continue"}
                          </Button>

                          <Button
                            variant="outlined"
                            size="large"
                            fullWidth
                            sx={{
                              borderRadius: "15px",
                              minHeight: 46,
                              borderColor: "rgba(15,23,42,0.18)",
                              color: "text.primary",
                              fontWeight: 650,
                              "&:hover": {
                                borderColor: "rgba(15,23,42,0.35)",
                                backgroundColor: "rgba(15,23,42,0.04)",
                              },
                            }}
                            disabled={
                              confirmingCustomer
                            }
                            onClick={
                              handleEditCustomerDetails
                            }
                          >
                            No, Edit My Details
                          </Button>
                        </Stack>

                        {error && (
                          <Typography
                            color="error"
                            sx={{
                              mt: 2,
                            }}
                          >
                            {error}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}


                {/* AI FOLLOW-UP / SCHEDULE PREFERENCE */}
                {!submitting &&
                  !awaitingCustomerConfirmation &&
                  requestResult?.status ===
                    "awaiting_information" && (
                    <FollowUpStep
                      message={requestResult.message}
                      value={followUpAnswer}
                      onChange={setFollowUpAnswer}
                      onSubmit={handleFollowUpSubmit}
                      submitting={submitting}
                      error={error}
                    />
                  )}



                {/* NO AVAILABILITY */}
                {!submitting &&
                  !awaitingCustomerConfirmation &&
                  noAvailability && (
                    <NoAvailabilityStep
                      message={
                        requestResult?.message ||
                        "We couldn't find an available technician for your requested service and time."
                      }
                      onTryAgain={
                        handleTryAgain
                      }
                    />
                  )}


                {/* APPOINTMENT OPTIONS */}
                {!submitting &&
                  !awaitingCustomerConfirmation &&
                  !noAvailability &&
                  requestResult?.status !==
                    "awaiting_information" &&
                  appointmentOptions.length >
                    0 && (
                    <AppointmentStep
                      options={
                        appointmentOptions
                      }
                      selectedOption={
                        selectedAppointment
                      }
                      onSelect={
                        setSelectedAppointment
                      }
                      onBack={
                        previousStep
                      }
                      onConfirm={
                        handleConfirmAppointment
                      }
                      confirming={
                        confirming
                      }
                    />
                  )}


                {/* GENERIC FALLBACK */}
                {!submitting &&
                  !awaitingCustomerConfirmation &&
                  !noAvailability &&
                  requestResult?.status !==
                    "awaiting_information" &&
                  appointmentOptions.length ===
                    0 &&
                  requestResult && (
                    <Box
                      sx={{
                        maxWidth: 680,
                        mx: "auto",
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="h3"
                        fontWeight={700}
                        gutterBottom
                      >
                        Your request is being handled.
                      </Typography>

                      <Typography
                        color="text.secondary"
                      >
                        {
                          requestResult.message
                        }
                      </Typography>
                    </Box>
                  )}
              </>
            )}


            {/* STEP 4 */}
            {currentStep === 4 && (
              <ConfirmationStep
                appointment={
                  selectedAppointment
                }
                message={
                  requestResult?.message
                }
                onReset={resetFlow}
              />
            )}
          </AnimatedStep>
        </Box>
      </Box>
    </PortalShell>
  );
}

export default CustomerPortal;