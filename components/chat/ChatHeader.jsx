"use client";

import { Archive, ChevronDown, Edit2, Folder, Trash } from "react-feather";
import { DeleteChatModal, DropdownMenu, RenameChatModal } from "@/components";
import { useDatabase, useModal } from "@/context";

export default function ChatHeader({ conversation = null, project = null }) {
  const { openModal, openMessage } = useModal();
  const { toggleArchiveConversation } = useDatabase();

  if (!conversation) return null;

  const { title, description, id, projectId } = conversation;

  const handleRename = () =>
    openModal(
      <RenameChatModal title={title} description={description} id={id} />,
    );
  const handleDelete = () =>
    openModal(<DeleteChatModal title={title} id={id} />);
  const handleArchive = async () => {
    const result = await toggleArchiveConversation(id, true);
    if (result) openMessage("Chat archived", "success");
  };

  const baseItems = [
    { id: "rename", label: "Rename", icon: Edit2, action: handleRename },
    { id: "archive", label: "Archive", icon: Archive, action: handleArchive },
    { id: "delete", label: "Delete", icon: Trash, action: handleDelete },
  ];

  const dropdownItems =
    projectId && project
      ? [
          {
            id: "project-overview",
            label: project.title,
            icon: Folder,
            separator: true,
            action: handleRename,
          },
          ...baseItems,
        ]
      : baseItems;

  return (
    <div className="w-full relative flex flex-col">
      <div className="absolute left-4 top-4 text-sm flex items-center justify-center text-neutral-400 border border-neutral-700 bg-neutral-950 z-50 rounded-xl">
        <DropdownMenu
          triggerClassName="flex items-center cursor-pointer px-2 py-1 relative z-10"
          dropdownList={dropdownItems}
          onClick={(e, menuItem) => {
            e.stopPropagation();
            menuItem.action();
          }}
        >
          <h3 className="max-w-50 truncate ml-2">{title}</h3>
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center outline-none cursor-pointer"
          >
            <ChevronDown size={19} />
          </button>
        </DropdownMenu>
      </div>
    </div>
  );
}
