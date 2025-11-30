import { walrusServices } from "@/constant";

export const getAggregatorUrl = (
  path: string,
  selectedService: string,
): string => {
  const service = walrusServices.find((s) => s.id === selectedService);
  const cleanPath = path.replace(/^\/+/, "").replace(/^v1\//, "");
  return `${service?.aggregatorUrl}/v1/${cleanPath}`;
};
