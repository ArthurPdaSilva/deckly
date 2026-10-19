import { Toaster } from "sonner";
import { useTheme } from "../theme/ThemeProvider";

export function AppToaster() {
  const { mode } = useTheme();
  return <Toaster position="bottom-center" richColors theme={mode} />;
}
