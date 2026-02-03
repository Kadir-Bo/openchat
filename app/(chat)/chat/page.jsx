"use client";

import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  {
    // Example
    // router.push(`/chat?id=${chatId}`);
    /* <Link href={`/chat?id=${chatId}`}></Link> */
  }
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id");

  return <div>Chat ID: {chatId}</div>;
}
