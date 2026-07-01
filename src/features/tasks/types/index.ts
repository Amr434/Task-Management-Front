export interface Tag {
  id: number;
  name: string;
  colorHex: string;
}

export interface TaskItem {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority: number;
  order: number;
  listId: number;
  tags?: Tag[];
}
