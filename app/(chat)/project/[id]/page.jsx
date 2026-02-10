"use client";

import { ChatInterface, PrimaryButton } from "@/components";
import { useDatabase } from "@/context/DatabaseContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowLeft, MoreVertical, Plus, Star } from "react-feather";

const PROJECT_OPTIONS = [
  { id: "star-project", label: "star project", icon: Star },
  { id: "star-project", label: "star project", icon: Star },
];

export default function ProjectIDPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();
  const { getProject, getProjectConversations, loading } = useDatabase();

  const [currentProject, setCurrentProject] = useState(null);
  const [conversations, setConversations] = useState([]);

  // Load project and its conversations
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      // Load project details
      const project = await getProject(projectId);
      if (project) {
        setCurrentProject(project);
      } else {
        // Project not found, redirect to projects page
        router.push("/projects");
        return;
      }

      // Load project conversations
      const projectConversations = await getProjectConversations(projectId);
      if (projectConversations) {
        setConversations(projectConversations);
      }
    };

    loadProject();
  }, [projectId, getProject, getProjectConversations, router]);

  const handleNavigateToChat = (chatId) => {
    router.push(`/chat/${chatId}`);
  };

  if (loading || !currentProject) {
    return (
      <div className="max-w-4xl mx-auto min-h-screen flex items-center justify-center">
        <p className="text-neutral-400">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto min-h-screen flex items-start justify-center gap-8 py-8">
      <div className="flex-1 flex flex-col gap-4">
        <PrimaryButton
          text="All Projects"
          href={"/projects"}
          icon={<ArrowLeft size={15} />}
          className="border-none hover:bg-transparent text-neutral-400 hover:text-neutral-100 w-max text-sm"
        />

        {/* Project Overview */}
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

        {/* Chat Interface */}
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

        {/* Project Conversations List */}
        <div className="mt-8">
          {conversations.length > 0 ? (
            <ul>
              {conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  className="group cursor-pointer border-t border-neutral-700/50 first:border-t-0 hover:border-transparent [&:hover+li]:border-transparent"
                >
                  <div
                    className="rounded-xl px-3 py-6 flex justify-between hover:bg-neutral-800/20"
                    onClick={() => handleNavigateToChat(conversation.id)}
                  >
                    <span>{conversation.title}</span>

                    <PrimaryButton
                      text={<MoreVertical size={17} />}
                      className="outline-none border-none shadow-none p-1.5 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded w-max min-w-max opacity-0 group-hover:opacity-100 transition-all duration-75 cursor-pointer"
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-12 text-neutral-400">
              <p>No conversations yet</p>
            </div>
          )}
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
  );
}
