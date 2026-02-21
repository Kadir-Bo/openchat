"use client";

import {
  ChatCard,
  ChatInterface,
  FilesPanel,
  PrimaryButton,
} from "@/components";
import InstructionsPanel from "@/components/chat/InstructionsPanel";
import { useDatabase } from "@/context/DatabaseContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, MoreVertical, Star } from "react-feather";

export default function ProjectIDPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const {
    getProject,
    updateProject,
    addDocumentToProject,
    removeDocumentFromProject,
    subscribeToConversations,
  } = useDatabase();

  const [currentProject, setCurrentProject] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ── load project ──
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        const project = await getProject(projectId);
        if (project) {
          setCurrentProject(project);
        } else {
          router.push("/projects");
        }
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadProject();
  }, [projectId, getProject, router]);

  // ── subscribe to conversations ──
  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = subscribeToConversations((allConversations) => {
      setConversations(
        allConversations.filter((conv) => conv.projectId === projectId),
      );
    });
    return () => unsubscribe();
  }, [projectId, subscribeToConversations]);

  // ── handlers ──

  const handleSaveInstructions = async (updates) => {
    await updateProject(projectId, updates);
    setCurrentProject((prev) => ({ ...prev, ...updates }));
  };

  const handleAddDocument = async (document) => {
    const newDoc = await addDocumentToProject(projectId, document);
    if (newDoc) {
      setCurrentProject((prev) => ({
        ...prev,
        documents: [...(prev.documents ?? []), newDoc],
      }));
    }
  };

  const handleRemoveDocument = async (documentId) => {
    await removeDocumentFromProject(projectId, documentId);
    setCurrentProject((prev) => ({
      ...prev,
      documents: (prev.documents ?? []).filter((d) => d.id !== documentId),
    }));
  };

  const handleNavigateToProject = (documentId) => {
    router.push(`/chat/${documentId}`);
  };

  // ── render ──

  if (isInitialLoading) {
    return (
      <div className="max-w-220 mx-auto h-dvh flex items-center justify-center">
        <p className="text-neutral-400">Loading project...</p>
      </div>
    );
  }

  if (!currentProject) return null;

  return (
    <div className="max-w-220 mx-auto h-dvh flex flex-col items-start justify-start gap-8 py-8">
      <PrimaryButton
        href={"/projects"}
        className="border-none hover:bg-transparent text-neutral-400 hover:text-neutral-100 w-max text-sm"
      >
        All Projects
        <ArrowLeft size={15} />
      </PrimaryButton>

      <div className="flex w-full gap-8 items-start justify-between">
        {/* ── left column ── */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-start gap-4 pl-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl">{currentProject.title}</h3>
              <p className="text-neutral-400">{currentProject.description}</p>
            </div>
            <div className="flex">
              <PrimaryButton className="outline-none border-none  cursor-pointer p-1.5 text-neutral-400 hover:bg-neutral-700/20 hover:text-neutral-100 rounded w-max min-w-max">
                <MoreVertical size={17} />
              </PrimaryButton>
              <PrimaryButton className="outline-none border-none  cursor-pointer p-1.5 text-neutral-400 hover:bg-neutral-700/20 hover:text-neutral-100 rounded w-max min-w-max">
                <Star size={17} />
              </PrimaryButton>
            </div>
          </div>

          <ChatInterface
            className="pb-0 no-scrollbar overflow-y-scroll"
            textAreaGrowHeight={160}
            placeholder="Create a new Chat"
            attachmentButtonClassName="hidden"
            sendButtonClassName="ml-auto"
            textareaClassName="px-5"
            textareaExpandedClassName="py-2 px-3"
            project_id={currentProject.id}
            project={currentProject}
            indicator={false}
          />

          <div className="flex flex-col gap-2">
            {conversations.map((conversation) => (
              <ChatCard
                key={conversation.id}
                conversation={conversation}
                onCardClick={() => handleNavigateToProject(conversation.id)}
              />
            ))}
          </div>
        </div>

        {/* ── right column ── */}
        <div className="max-w-sm w-full border border-neutral-700 rounded-2xl overflow-hidden">
          <InstructionsPanel
            project={currentProject}
            onSave={handleSaveInstructions}
          />

          <hr className="border-neutral-700" />

          <FilesPanel
            project={currentProject}
            onAddDocument={handleAddDocument}
            onRemoveDocument={handleRemoveDocument}
          />
        </div>
      </div>
    </div>
  );
}
