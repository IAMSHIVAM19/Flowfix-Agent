import { useState } from "react";

const TOTAL_STEPS = 4;

function useCustomerFlow() {
  const [currentStep, setCurrentStep] = useState(1);

  const [issue, setIssue] = useState("");

  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [requestResult, setRequestResult] = useState(null);

  const [followUpAnswer, setFollowUpAnswer] = useState("");

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [confirming, setConfirming] = useState(false);

  const [confirmingCustomer, setConfirmingCustomer] =
    useState(false);

  const [error, setError] = useState("");

  function nextStep() {
    setCurrentStep((step) =>
      Math.min(step + 1, TOTAL_STEPS)
    );
  }

  function previousStep() {
    setCurrentStep((step) =>
      Math.max(step - 1, 1)
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

    setFollowUpAnswer("");

    setSelectedAppointment(null);

    setSubmitting(false);

    setConfirming(false);

    setConfirmingCustomer(false);

    setError("");
  }

  return {
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
  };
}

export default useCustomerFlow;