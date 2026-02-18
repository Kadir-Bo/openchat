import React from "react";
import { DeleteChatModal, RenameChatModal, DropdownMenu } from "@/components";
import { Archive, ArrowLeft, ChevronDown, Edit2, Trash } from "react-feather";
import { useModal, useDatabase } from "@/context";

export default function ChatHeader({ conversation = null }) {
  const { openModal, openMessage } = useModal();
  const { toggleArchiveConversation } = useDatabase();

  if (!conversation) return null;

  const { title, description, id, projectId } = conversation;

  const handleRenameChat = () => {
    return openModal(
      <RenameChatModal title={title} description={description} id={id} />,
    );
  };

  const handleArchiveChat = async () => {
    const result = await toggleArchiveConversation(id, true);
    if (result) {
      openMessage("Chat archived", "success");
    }
  };

  const handleDeleteChat = () => {
    return openModal(<DeleteChatModal title={title} id={id} />);
  };

  const ChatDropDownMenu = [
    {
      id: "rename-chat",
      label: "Umbenennen",
      icon: Edit2,
      action: () => handleRenameChat(),
    },
    {
      id: "archive-chat",
      label: "Archivieren",
      icon: Archive,
      action: () => handleArchiveChat(),
    },
    {
      id: "delete-chat",
      label: "Löschen",
      icon: Trash,
      action: () => handleDeleteChat(),
    },
  ];
  const PrjojectDropDownMenu = [
    {
      id: "overview",
      label: "View Project",
      icon: ArrowLeft,
      action: () => handleRenameChat(),
    },
  ];

  const DROPDOWN_LIST = projectId ? PrjojectDropDownMenu : ChatDropDownMenu;

  return (
    <div className="w-full relative">
      <div className="absolute left-4 top-4 text-sm flex items-center justify-center text-neutral-400 border border-neutral-700 rounded-xl">
        <DropdownMenu
          triggerClassName="flex items-center cursor-pointer px-2 py-1"
          dropdownList={DROPDOWN_LIST}
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
