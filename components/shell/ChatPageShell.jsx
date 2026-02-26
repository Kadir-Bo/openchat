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
  children,
}) {
  const activeSort = FILTER_OPTIONS.find((o) => o.value === sortBy);

  return (
    <div className="flex-1 flex flex-col max-w-220 mx-auto py-8 gap-6 w-full px-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-light">{title}</h1>
        <PrimaryButton
          className="w-max justify-center text-sm min-w-32"
          href={headerActionLink}
          filled
        >
          {headerActionTitle}
          <Icon name={Plus} size="sm" />
        </PrimaryButton>
      </header>

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

      <div className="flex justify-end items-center gap-3">
        <span className="text-neutral-400 text-sm">Sort by:</span>
        <Select
          id="sort"
          name="sort"
          label=""
          value={activeSort?.label || "Sort by"}
          list={FILTER_OPTIONS}
          onChange={(e) => onSortChange(e.target.value)}
          containerClassName="w-auto min-w-40"
          labelClassName="hidden"
          buttonClassName="text-sm px-3 min-w-32"
        />
      </div>

      <Searchbar
        key={activeTab}
        onSearch={onSearch}
        placeholder={searchPlaceholder}
      />

      <div className="flex items-center justify-between">
        <SelectionStatus
          selectedCount={selectedCount}
          itemType={itemType}
          hasItems={hasItems}
        />
        <div className="flex items-center gap-2">{actions}</div>
      </div>

      {children}
    </div>
  );
}
