import { AlertTriangle, Phone } from "lucide-react";
import { Button } from "./button";
import { useState } from "react";

export function FloatingSOS() {
  const [isEmergency, setIsEmergency] = useState(false);

  const handleSOSClick = () => {
    setIsEmergency(true);
    // In a real app, this would trigger emergency calls/notifications
    // Call and notification should go to Property manager, call center, Area Manager, and Safety & Security head
    console.log("SOS EMERGENCY TRIGGERED");
    alert("Emergency services have been notified. Help is on the way!");
    
    setTimeout(() => setIsEmergency(false), 5000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleSOSClick}
        className={`rounded-full w-14 h-14 shadow-lg ${
          isEmergency 
            ? "bg-red-600 hover:bg-red-700 animate-pulse" 
            : "bg-red-500 hover:bg-red-600"
        }`}
        data-testid="button-sos"
      >
        {isEmergency ? (
          <Phone className="h-6 w-6" />
        ) : (
          <AlertTriangle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}