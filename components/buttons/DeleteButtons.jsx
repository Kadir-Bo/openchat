"use client";

import { Trash2 } from "react-feather";
import { PrimaryButton, DeleteConfirmModal, Icon } from "@/components";
import { useModal } from "@/context";
const redClass =
  "w-max text-sm px-4 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/60";

export default function DeleteButtons({
  selectedCount,
  itemType,
  hasItems,
  onDeleteSelected,
  onDeleteAll,
  extraActions,
}) {
  const { openModal } = useModal();

  const label = selectedCount === 1 ? itemType : `${itemType}s`;

  const openDeleteSelectedModal = () => {
    openModal(
      <DeleteConfirmModal
        title={`${selectedCount} ${label}`}
        description={`Are you sure you want to delete ${selectedCount} ${label}? This action cannot be undone.`}
        onConfirm={onDeleteSelected}
      />,
    );
  };

  const openDeleteAllModal = () => {
    openModal(
      <DeleteConfirmModal
        title={`all ${label}`}
        description={`Are you sure you want to delete all ${label}? This action cannot be undone.`}
        onConfirm={onDeleteAll}
      />,
    );
  };

  return (
    <>
      {extraActions}

      {selectedCount > 0 ? (
        <PrimaryButton className={redClass} onClick={openDeleteSelectedModal}>
          {`Delete ${selectedCount} ${label}`}
          <Trash2 size={14} />
        </PrimaryButton>
      ) : (
        hasItems && (
          <PrimaryButton className={redClass} onClick={openDeleteAllModal}>
            {`Delete all ${label}`}
            <Icon name={Trash2} size="md" />
          </PrimaryButton>
        )
      )}
    </>
  );
}
