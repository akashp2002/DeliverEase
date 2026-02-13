import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Format full address from location object
export function formatFullAddress(location: any): string {
  const parts = [
    location.streetAddress,
    location.area,
    location.city,
    location.state,
    location.postalCode,
  ].filter(Boolean);
  return parts.join(', ');
}

// Format short address (street + area)
export function formatShortAddress(location: any): string {
  const parts = [location.streetAddress, location.area].filter(Boolean);
  return parts.join(', ');
}