import Image from "next/image";
import React from "react";

export default function UserProfileImage({ image, username }) {
  const letter = username.trim().slice(0, 1);
  return (
    <div className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center bg-neutral-950 overflow-hidden">
      {image ? (
        <Image
          src={image}
          alt="user"
          width={80}
          height={100}
          className=" object-cover h-full"
        />
      ) : (
        <span className="uppercase">{letter}</span>
      )}
    </div>
  );
}
