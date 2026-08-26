import { useState } from "react";

const TOTAL_STEPS = 4;

function useCustomerFlow() {
  const [currentStep, setCurrentStep] =
    useState(1);

  const [issue, setIssue] =
    useState("");

  const [customerDetails, setCustomerDetails] =
    useState({
      name: "",
      phone: "",
      address: "",
    });

  const [requestResult, setRequestResult] =
    useState(null);

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [confirming, setConfirming] =
    useState(false);

  const [error, setError] =
    useState("");

  function nextStep() {
    setCurrentStep((step) =>
      Math.min(
        step + 1,
        TOTAL_STEPS
      )
    );
  }

  function previousStep() {
    setCurrentStep((step) =>
      Math.max(
        step - 1,
        1
      )
    );
  }

  function resetFlow() {
    setCurrentStep(1);

    setIssue("");

    setCustomerDetails({
      name: "",
      phone: "",
      address: "",
    });

    setRequestResult(null);

    setSelectedAppointment(null);

    setSubmitting(false);

    setConfirming(false);

    setError("");
  }

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,

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
    resetFlow,
  };
}

export default useCustomerFlow;