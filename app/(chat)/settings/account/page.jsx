"use client";

import { DeleteAccountModal, PrimaryButton } from "@/components";
import { useAuth, useModal } from "@/context";
import { useState } from "react";
import { LogOut, Trash2 } from "react-feather";

function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const { openModal, openMessage } = useModal();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      openMessage("Logged out successfully", "success");
    } catch (error) {
      openMessage("Failed to log out", "error");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    openModal(<DeleteAccountModal />);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Account</h4>
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">{user?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-white font-medium text-sm">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </div>

      <hr className="text-neutral-700" />

      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Session</h4>
        <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-800 bg-neutral-900/30">
          <div>
            <p className="text-sm font-medium text-white">Log out</p>
            <p className="text-sm text-neutral-400">
              Sign out of your account on this device
            </p>
          </div>
          <PrimaryButton
            text={isLoggingOut ? "Logging out..." : "Log out"}
            icon={<LogOut size={15} />}
            className="w-max px-3 min-w-28 justify-center"
            onClick={handleLogout}
            disabled={isLoggingOut}
          />
        </div>
      </div>

      <hr className="text-neutral-700" />

      <div className="flex flex-col gap-5">
        <h4 className="font-medium">Danger Zone</h4>
        <div className="flex items-center justify-between p-4 rounded-xl border border-red-900/30 bg-red-950/10">
          <div>
            <p className="text-sm font-medium text-white">Delete Account</p>
            <p className="text-sm text-neutral-400">
              Permanently delete your account and all associated data
            </p>
          </div>
          <PrimaryButton
            text="Delete Account"
            icon={<Trash2 size={15} />}
            className="w-max px-3 min-w-36 justify-center border-red-700/60 text-red-500 hover:bg-red-700/10"
            onClick={handleDeleteAccount}
          />
        </div>
      </div>
    </div>
  );
}

export default AccountSettingsPage;
