import type { Metadata } from "next";
import { CategoriesManager } from "./CategoriesManager";

export const metadata: Metadata = { title: "Kelola Kategori" };

export default function CategoriesPage() {
  return <CategoriesManager />;
}
