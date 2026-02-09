"use client";

import { ChatInterface, ChatList, PrimaryButton } from "@/components";
import { useParams, useRouter } from "next/navigation";
import React, { useMemo } from "react";
import {
  ArrowLeft,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Star,
} from "react-feather";
import { EXAMPLE_PROJECTS } from "@/lib";

const PROJECT_OPTIONS = [
  { id: "star-project", label: "star project", icon: Star },
  { id: "star-project", label: "star project", icon: Star },
];

export default function ProjectIDPage() {
  const params = useParams();
  const projectId = params?.id;
  const router = useRouter();

  const currentProject = useMemo(() => {
    return EXAMPLE_PROJECTS.find((project) => project.id === projectId);
  }, [projectId]);

  const handleNavigateToChat = (chatId) => {
    router.push(`/chat/${chatId}`);
  };
  return (
    <div className="max-w-4xl mx-auto min-h-screen flex items-start justify-center gap-8 pt-20">
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
        <ChatInterface className="pb-0" textAreaGrowHeight={200} />
        {/* Project Chat List */}
        <ul>
          {currentProject.chats.map((chat) => (
            <li
              key={chat.id}
              className="group cursor-pointer border-t border-neutral-700/50 first:border-t-0 h7over:border-transparent [&:hover+li]:border-transparent"
            >
              <div
                className="rounded-xl px-3 py-6 flex justify-between hover:bg-neutral-800/20"
                onClick={() => handleNavigateToChat(chat.id)}
              >
                <span>{chat.title}</span>

                <PrimaryButton
                  text={<MoreVertical size={17} />}
                  className="outline-none border-none shadow-none p-1.5 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded w-max min-w-max opacity-0 group-hover:opacity-100 transition-all duration-75 cursor-pointer"
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="max-w-sm border border-neutral-700 rounded-2xl">
        <div className="flex justify-between items-start p-6">
          <div className="flex flex-col gap-2">
            <h3>Instructions</h3>
            <p className="text-neutral-400 text-sm">
              Add instructions to tailor Claude’s responses
            </p>
          </div>
          <PrimaryButton
            text={<Plus size={17} />}
            className="outline-none border-none shadow-none cursor-pointer p-1.5 text-gray-400 hover:bg-neutral-700/20 hover:text-gray-100 rounded w-max min-w-max"
          />
        </div>
        <hr />
        <div className="flex justify-between items-start p-6">
          <div className="flex flex-col gap-2">
            <h3>Files</h3>
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
