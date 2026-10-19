import { toast } from "sonner";

/** Único ponto de acesso a toasts: as telas nunca importam o Sonner direto. */
export const notify = {
  success(message: string) {
    toast.success(message);
  },
  error(message: string) {
    toast.error(message);
  },
  info(message: string) {
    toast(message);
  },
};
