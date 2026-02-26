import { AnimatePresence, motion } from "framer-motion";
import { LogIn, MessageCircle } from "react-feather";
import { Icon, PrimaryButton } from "@/components";

export default function MessageLimitAlert({ max }) {
  return (
    <AnimatePresence>
      <motion.div
        key="limit-alert"
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full py-3 mb-8 rounded-2xl border border-neutral-700 bg-neutral-900 flex items-center justify-between gap-4 px-4"
      >
        <div className="flex items-center gap-3 text-sm text-neutral-300">
          <Icon
            name={MessageCircle}
            size="sm"
            className="shrink-0 text-neutral-500"
          />
          <span>
            You&apos;ve used all{" "}
            <span className="text-white font-medium">{max}</span> free messages.
            Sign up to keep chatting.
          </span>
        </div>
        <PrimaryButton className="w-max px-4" filled href={"/sign-in"}>
          sign-in
          <Icon name={LogIn} size="sm" />
        </PrimaryButton>
      </motion.div>
    </AnimatePresence>
  );
}
