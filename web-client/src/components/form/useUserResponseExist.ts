import { useUserId } from "@/providers/UserProvider";
import config from "@/config";
import { useEffect, useState } from "react";

export function useUserResponseExist(formId: string) {
  const userId = useUserId();
  const [exist, setExist] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId || exist !== null) return;

    const checkExistence = async () => {
      const doesExist = await fetchUserResponse();
      setExist(doesExist);
    };

    checkExistence();
  }, [userId, exist]);

  // create fetch request to get user response for the form
  const fetchUserResponse = async () => {
    if (!userId) return false;

    try {
      const response = await fetch(
        `${config.api.examinationForm.getUserFormResponse(userId, formId)}`
      );
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error fetching user response:", error);
      return false;
    }
  };

  return { fetchUserResponse, exist };
}
