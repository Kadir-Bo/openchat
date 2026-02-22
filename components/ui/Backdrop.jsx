import { motion } from "framer-motion";

export default function Backdrop({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9998] backdrop-blur-md bg-black/40"
      onPointerDown={onClose}
    />
  );
}
