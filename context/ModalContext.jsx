"use client";

import { Message } from "@/components";
import { useOnClickOutside } from "@/hooks";
import { AnimatePresence } from "framer-motion";
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";

export const ModalContext = createContext(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export default function ModalProvider({ children }) {
  const [modalContent, setModalContent] = useState(null);
  const [messageContent, setMessageContent] = useState();
  const modalContentRef = useRef();
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useOnClickOutside(modalContentRef, () => setModalContent(null));

  useEffect(() => {
    let resizeObserver;

    const observe = () => {
      const sidebar = document.getElementById("sidebar");
      if (!sidebar) return false;

      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setSidebarWidth(entry.contentRect.width);
        }
      });

      resizeObserver.observe(sidebar);
      setSidebarWidth(sidebar.offsetWidth);
      return true;
    };

    if (!observe()) {
      // Sidebar not in DOM yet, wait for next frame
      const raf = requestAnimationFrame(() => observe());
      return () => cancelAnimationFrame(raf);
    }

    return () => resizeObserver?.disconnect();
  }, []);

  const openModal = useCallback((component) => {
    setModalContent(component);
  }, []);

  const closeModal = useCallback(() => {
    setModalContent(null);
  }, []);

  const openMessage = useCallback((message, variant = null) => {
    setMessageContent({ message, variant });
  }, []);

  const closeMessage = useCallback(() => {
    setMessageContent(null);
  }, []);

  const values = {
    openModal,
    closeModal,
    openMessage,
    closeMessage,
  };

  return (
    <ModalContext.Provider value={values}>
      {modalContent && (
        <div className="fixed inset-0 bg-neutral-950/80 z-9999 flex items-center justify-center">
          <div
            ref={modalContentRef}
            className="relative p-6 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto"
          >
            {modalContent}
          </div>
        </div>
      )}

      <AnimatePresence>
        {messageContent && (
          <div
            className="fixed top-7 z-10000"
            style={{
              left: `${sidebarWidth}px`,
              width: `calc(100vw - ${sidebarWidth}px)`,
            }}
          >
            <div className="flex flex-col items-end justify-start max-w-480 mx-auto pr-3">
              <Message
                message={messageContent.message}
                variant={messageContent.variant}
                onClose={closeMessage}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {children}
    </ModalContext.Provider>
  );
}
