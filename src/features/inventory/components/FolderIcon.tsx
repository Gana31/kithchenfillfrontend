import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface FolderIconProps {
  color: string;
  size?: number;
}

/** A folder glyph tinted with the folder's color — the only thing users customize. */
export default function FolderIcon({ color, size = 24 }: FolderIconProps) {
  return <Ionicons name="folder" size={size} color={color} />;
}
