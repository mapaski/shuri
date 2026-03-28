import { createContext, useContext, useState, ReactNode } from "react";
import { Device } from "@/hooks/use-scan-data";

interface DeviceDrawerContextType {
  selectedDevice: Device | null;
  openDrawer: (device: Device) => void;
  closeDrawer: () => void;
}

const DeviceDrawerContext = createContext<DeviceDrawerContextType>({
  selectedDevice: null,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function DeviceDrawerProvider({ children }: { children: ReactNode }) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  return (
    <DeviceDrawerContext.Provider
      value={{
        selectedDevice,
        openDrawer: setSelectedDevice,
        closeDrawer: () => setSelectedDevice(null),
      }}
    >
      {children}
    </DeviceDrawerContext.Provider>
  );
}

export function useDeviceDrawer() {
  return useContext(DeviceDrawerContext);
}
