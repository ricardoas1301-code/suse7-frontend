// ======================================================
// ICON REGISTRY: S7
// Objetivo:
// - Centralizar o mapeamento de ícones do Design System
// ======================================================

import {
  LayoutDashboard,
  Box,
  Tag,
  Calculator,
  Activity,
  BarChart3,
  FileText,
  Download,
  Copy,
  ExternalLink,
  GripVertical,
  Trash2,
  Info,
  Plus,
  Image as ImageIcon,
  Inbox,
} from "lucide-react";

export const iconsMap = {
  dashboard: LayoutDashboard,
  products: Box,
  ads: Tag,
  pricing: Calculator,
  monitoring: Activity,
  reports: BarChart3,
  records: FileText,

  download: Download,
  copy: Copy,
  external: ExternalLink,
  reorder: GripVertical,
  trash: Trash2,
  info: Info,
  plus: Plus,
  image: ImageIcon,
  empty: Inbox,
};
