import { Plus } from "react-feather";
import {
  Icon,
  PrimaryButton,
  Searchbar,
  Select,
  SelectionStatus,
} from "@/components";
import { FILTER_OPTIONS } from "@/lib";

export default function ChatPageShell({
  title,
  tabs,
  activeTab,
  onTabChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearch,
  searchPlaceholder,
  selectedCount,
  hasItems,
  itemType,
  actions,
  headerActionTitle = "New Chat",
  headerActionLink = "/chat",
  clearSelection = () => null,
  children,
}) {
  const activeSort = FILTER_OPTIONS.find((o) => o.value === sortBy);

  return (
    <div className="flex-1 flex flex-col max-w-220 mx-auto py-8 gap-6 w-full px-4">
      {/* Tabs */}
      {tabs && (
        <div className="flex items-center gap-1 border-b border-neutral-800">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`px-4 py-2 text-sm capitalize transition-colors duration-150 border-b-2 -mb-px ${
                activeTab === key
                  ? "border-neutral-300 text-neutral-100"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {label}
              <span className="ml-2 text-xs text-neutral-600">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Select & Delete */}
      <div className="flex items-center justify-between">
        <SelectionStatus
          selectedCount={selectedCount}
          itemType={itemType}
          hasItems={hasItems}
          onCancel={clearSelection}
        />
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {/* Searchbar & Chats */}

      <div className="flex gap-3">
        <Searchbar
          key={activeTab}
          onSearch={onSearch}
          placeholder={searchPlaceholder}
        />
        <div className="flex justify-end items-center gap-3">
          <Select
            id="sort"
            name="sort"
            label=""
            value={activeSort?.label || "Sort by"}
            list={FILTER_OPTIONS}
            onChange={(e) => onSortChange(e.target.value)}
            containerClassName="w-max min-w-20"
            labelClassName="hidden"
            buttonClassName="text-sm px-3 w-max justify-center font-normal"
          />
        </div>
      </div>
      {children}
    </div>
  );
}
