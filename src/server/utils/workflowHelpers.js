const markStep = (workflow, stepName, status, userId, comments) => {
  const step = workflow.find((s) => s.step === stepName);
  if (step) {
    step.status = status;
    if (['completed', 'rejected'].includes(status)) step.completedAt = new Date();
    if (userId) step.assignedTo = userId;
    if (comments) step.comments = comments;
  }
};

const advanceStep = (workflow, fromStep, toStep) => {
  markStep(workflow, fromStep, 'completed');
  markStep(workflow, toStep, 'in_progress');
};

module.exports = { markStep, advanceStep };
