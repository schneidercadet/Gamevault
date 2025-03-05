"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ClientButton from "./ui/ClientButton";

interface BackButtonProps {
  defaultPath?: string;
  className?: string;
}

export default function BackButton({
  defaultPath = "/games",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(defaultPath);
    }
  };

  const buttonClass = `flex items-center space-x-2 px-4 py-2 text-white ${className}`;

  return (
    <ClientButton
      onClick={handleBack}
      className={buttonClass}
    >
      <ArrowLeftIcon className="bold h-5 w-5" />
      <span className="font-medium"></span>
    </ClientButton>
  );
}
