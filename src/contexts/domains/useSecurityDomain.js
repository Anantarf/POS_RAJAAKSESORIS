import { useCallback, useMemo } from "react";
import { normalizeSecurityControls } from "../../core/normalizers/employeeNormalizer";
import { toClientMessage } from "../../utils/clientMessages";

export function useSecurityDomain({ appSettings, setAppSettings, user, supabase }) {
  const globalPinSettingEnabled =
    appSettings.pin_required_enabled?.value?.enabled !== false;

  const securityControls = useMemo(
    () => normalizeSecurityControls(appSettings.security_controls?.value, globalPinSettingEnabled),
    [appSettings.security_controls?.value, globalPinSettingEnabled]
  );

  const pinRequiredEnabled =
    globalPinSettingEnabled && Object.values(securityControls).some((control) => control.enabled);

  const setPinRequiredEnabled = useCallback(
    async (enabled) => {
      if (user?.role !== "pemilik") {
        throw new Error("Hanya pemilik yang dapat mengubah pengaturan PIN.");
      }

      const { data, error } = await supabase.rpc("owner_set_pin_required_enabled", {
        p_enabled: Boolean(enabled),
      });

      if (error) {
        throw new Error(toClientMessage(error.message, "Gagal mengubah pengaturan PIN."));
      }

      setAppSettings((current) => ({
        ...current,
        pin_required_enabled: {
          key: "pin_required_enabled",
          value: data || { enabled: Boolean(enabled) },
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
      }));

      return data;
    },
    [user, supabase, setAppSettings]
  );

  const setSecurityControls = useCallback(
    async (controls) => {
      if (user?.role !== "pemilik") {
        throw new Error("Hanya pemilik yang dapat mengubah kontrol keamanan.");
      }

      const nextControls = normalizeSecurityControls(controls, true);
      const { data, error } = await supabase.rpc("owner_set_security_controls", {
        p_controls: nextControls,
      });

      if (error) {
        throw new Error(toClientMessage(error.message, "Gagal mengubah kontrol keamanan."));
      }

      setAppSettings((current) => ({
        ...current,
        security_controls: {
          key: "security_controls",
          value: data || nextControls,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
      }));

      return data || nextControls;
    },
    [user, supabase, setAppSettings]
  );

  return { securityControls, pinRequiredEnabled, setPinRequiredEnabled, setSecurityControls };
}
