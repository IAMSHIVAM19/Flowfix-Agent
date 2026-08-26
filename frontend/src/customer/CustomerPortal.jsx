import {
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";

import PortalShell from "./components/PortalShell";
import ProgressIndicator from "./components/ProgressIndicator";
import IssueStep from "./components/IssueStep";
import DetailsStep from "./components/DetailsStep";
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

    error,
    setError,

    nextStep,
    previousStep,
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


  const appointmentOptions =
    requestResult?.appointment_options || [];

  const noAvailability =
    requestResult?.status ===
    "no_availability";


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
            }}
          >
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                letterSpacing:
                  "-0.02em",
              }}
            >
              FlowFix
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: {
                  xs: "none",
                  sm: "block",
                },
              }}
            >
              Plumbing made simple.
            </Typography>
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
                {submitting && (
                  <UnderstandingStep
                    error={error}
                  />
                )}


                {/* AI FOLLOW-UP QUESTION */}
                {!submitting &&
                  requestResult?.status ===
                    "awaiting_information" && (
                    <Box
                      sx={{
                        maxWidth: 720,
                        mx: "auto",
                      }}
                    >
                      <Box
                        sx={{
                          p: {
                            xs: 2,
                            sm: 3,
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
                          We need one more detail.
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

                        <TextField
                          fullWidth
                          multiline
                          minRows={4}
                          value={followUpAnswer}
                          onChange={(event) =>
                            setFollowUpAnswer(
                              event.target.value
                            )
                          }
                          placeholder="Tell us a little more..."
                        />

                        <Button
                          variant="contained"
                          size="large"
                          fullWidth
                          sx={{
                            mt: 2,
                            borderRadius: "15px",
                            minHeight: 52,
                          }}
                          disabled={
                            followUpAnswer.trim().length < 2 ||
                            submitting
                          }
                          onClick={
                            handleFollowUpSubmit
                          }
                        >
                          Continue
                        </Button>

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


                {/* NO AVAILABILITY */}
                {!submitting &&
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
              />
            )}
          </AnimatedStep>
        </Box>
      </Box>
    </PortalShell>
  );
}

export default CustomerPortal;