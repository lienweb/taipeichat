import { cn } from "@/lib/utils";

interface RegistrationStepperProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: "Connect Wallet" },
  { id: 2, label: "Set Username" },
  { id: 3, label: "Complete" },
];

export const RegistrationStepper = ({ currentStep }: RegistrationStepperProps) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center justify-center  flex-shrink-0">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 text-xl font-bold",
                    isCompleted && "bg-primary text-primary-foreground",
                    isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground",
                  )}
                >
                  {step.id}
                </div>
                <span
                  className={cn(
                    "mt-2 text-sm font-medium transition-colors text-center",
                    (isActive || isCompleted) && "text-primary",
                    !isActive && !isCompleted && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 relative">
                  <div className="absolute inset-0 bg-muted" />
                  <div
                    className={cn(
                      "absolute inset-0 bg-primary transition-all duration-300",
                      isCompleted ? "w-full" : "w-0",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
