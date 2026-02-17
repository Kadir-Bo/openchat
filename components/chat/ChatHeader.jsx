import React from "react";
import { DeleteChatModal, RenameChatModal, DropdownMenu } from "@/components";
import { Archive, ChevronDown, Edit2, Trash } from "react-feather";
import { useModal, useDatabase } from "@/context";

export default function ChatHeader({ conversation = null }) {
  const { openModal, openMessage } = useModal();
  const { toggleArchiveConversation } = useDatabase();

  if (!conversation) return null;

  const { title, description, id } = conversation;

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

  return (
    <div className="w-full relative">
      <div className="absolute left-0 top-0 p-3 text-sm flex items-center justify-center text-neutral-400">
        <DropdownMenu
          triggerClassName="flex items-center gap-1"
          dropdownList={ChatDropDownMenu}
          onClick={(e, menuItem) => {
            e.stopPropagation();
            menuItem.action();
          }}
        >
          <h3 className="max-w-50 truncate">{title}</h3>
          <ChevronDown size={17} />
        </DropdownMenu>
      </div>
    </div>
  );
}
