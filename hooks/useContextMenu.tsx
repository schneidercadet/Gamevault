// File: /hooks/useContextMenu.tsx
"use client";

import { useState, useCallback } from "react";

type MenuItem = {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
};

type Position = {
  x: number;
  y: number;
};

export const useContextMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const show = useCallback((items: MenuItem[], pos: Position) => {
    // Calculate position to prevent overflow
    const menuWidth = 200; 
    const menuHeight = items.length * 40; 
    const padding = 16; 
    
    const x = Math.min(pos.x, window.innerWidth - menuWidth - padding);
    const y = Math.min(pos.y, window.innerHeight - menuHeight - padding);
    
    setMenuItems(items);
    setPosition({ x, y });
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const ContextMenu = () => (
    isVisible && (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={hide}
        />
        <div
          className="fixed z-50 min-w-[200px] rounded-lg bg-background-lighter border border-background-light shadow-lg p-2"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            maxHeight: 'calc(100vh - 32px)', 
            overflowY: 'auto'
          }}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.action();
                hide();
              }}
              className={`w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${
                item.destructive
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-foreground hover:bg-background-light"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </>
    )
  );

  return { show, hide, ContextMenu };
};