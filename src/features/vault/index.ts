import { encryptItem, decryptItem } from "../../lib/crypto";
import { useInterviewStore } from "../../store/interviews";

export async function encryptInterview(interviewId: string): Promise<boolean> {
  const interview = useInterviewStore.getState().getById(interviewId);
  if (!interview) return false;

  try {
    const payload = JSON.stringify(interview);
    await encryptItem(interviewId, payload);
    return true;
  } catch {
    return false;
  }
}

export async function decryptInterview(interviewId: string): Promise<boolean> {
  try {
    const raw = await decryptItem(interviewId);
    if (!raw) return false;

    const interview = JSON.parse(raw);
    useInterviewStore.getState().update(interviewId, interview);
    return true;
  } catch {
    return false;
  }
}

export async function deleteFromVault(interviewId: string): Promise<void> {
  const { removeItem } = await import("../../lib/crypto");
  await removeItem(interviewId);
}
