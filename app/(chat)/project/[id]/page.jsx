"use client";

import { ChatCard, ChatInterface, PrimaryButton } from "@/components";
import { useDatabase } from "@/context/DatabaseContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowLeft, MoreVertical, Plus, Star } from "react-feather";

export default function ProjectIDPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const { getProject, getProjectConversations } = useDatabase();

  const [currentProject, setCurrentProject] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      try {
        const project = await getProject(projectId);
        if (project) {
          setCurrentProject(project);
        } else {
          router.push("/projects");
          return;
        }

        const projectConversations = await getProjectConversations(projectId);
        if (projectConversations) {
          setConversations(projectConversations);
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadProject();
  }, [projectId, getProject, getProjectConversations, router]);

  if (isInitialLoading) {
    return (
      <div className="max-w-5xl mx-auto min-h-screen flex items-center justify-center">
        <p className="text-neutral-400">Loading project...</p>
      </div>
    );
  }

  if (!currentProject) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto min-h-screen flex flex-col items-start justify-start gap-8 py-8">
      <PrimaryButton
        text="All Projects"
        href={"/projects"}
        icon={<ArrowLeft size={15} />}
        className="border-none hover:bg-transparent text-neutral-400 hover:text-neutral-100 w-max text-sm"
      />
      <div className="flex w-full gap-8 items-start justify-between">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-start gap-4 pl-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl">{currentProject.title}</h3>
              <p className="text-neutral-400">{currentProject.description}</p>
            </div>
            <div className="flex">
              <PrimaryButton
                text={<MoreVertical size={17} />}
                className="outline-none border-none shadow-none cursor-pointer p-1.5 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded w-max min-w-max"
              />
              <PrimaryButton
                text={<Star size={17} />}
                className="outline-none border-none shadow-none cursor-pointer p-1.5 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded w-max min-w-max"
              />
            </div>
          </div>

          <ChatInterface
            className="pb-0 no-scrollbar overflow-y-scroll"
            textAreaGrowHeight={160}
            placeholder="Create a new Chat"
            extrasButtonClassName="hidden"
            sendButtonClassName="ml-auto"
            textareaClassName="px-5"
            textareaExpandedClassName="py-2 px-3"
            project_id={currentProject.id}
          />

          <div className="flex flex-col gap-2">
            {conversations.map((conversation) => (
              <ChatCard key={conversation.id} conversation={conversation} />
            ))}
          </div>
        </div>

        <div className="max-w-sm border border-neutral-700 rounded-2xl">
          <div className="flex justify-between items-start p-6">
            <div className="flex flex-col gap-2">
              <h3>Instructions</h3>
              <p className="text-neutral-400 text-sm">
                Add instructions to tailor responses
              </p>
            </div>
            <PrimaryButton
              text={<Plus size={17} />}
              className="outline-none border-none shadow-none cursor-pointer p-1.5 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded w-max min-w-max"
            />
          </div>
          <hr className="border-neutral-700" />
          <div className="flex justify-between items-start p-6">
            <div className="flex flex-col gap-2">
              <h3>Files</h3>
              <p className="text-neutral-400 text-sm">
                {currentProject.documents?.length || 0} files
              </p>
            </div>
            <PrimaryButton
              text={<Plus size={17} />}
              className="outline-none border-none shadow-none cursor-pointer p-1.5 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded w-max min-w-max"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
