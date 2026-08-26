import {
  Box,
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

                {!submitting &&
                  !noAvailability &&
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

                {!submitting &&
                  !noAvailability &&
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