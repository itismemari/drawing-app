"use client";
import React, { useRef, useState } from "react";
import {
  DraggableCardContainer,
} from "@/components/ui/draggable-card";

type DraggableCardProps = {
  className?: string;
  children?: React.ReactNode;
};

export function DraggableCard({ children, ...props }: DraggableCardProps) {
  return (
    <DraggableCardContainer className={props.className}>
        {children}
    </DraggableCardContainer>
  );
}
