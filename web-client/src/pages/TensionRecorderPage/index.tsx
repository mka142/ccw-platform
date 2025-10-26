import React from "react";

import { TensionRecorder } from "../../components/TensionRecorder";

export default function TensionRecorderPage() {
  const sendData = async (data: any) => {
    console.log("Sending data", data);
    try {
      const response = await fetch("/api/send-data", {
        // <- Use correct endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error sending data:", error);
    }
    //return response.json();
  };
  return (
    <TensionRecorder
      currentTimeMs={() => Date.now()}
      onComplete={(points) => {
        sendData(points);
      }}
    />
  );
}
