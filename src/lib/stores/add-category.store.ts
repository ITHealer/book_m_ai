import type { Category } from '$lib/types/Category.type';
import { writable } from 'svelte/store';

export interface AddCategoryState {
	open?: boolean;
	parentCategory?: Category | null;
	// Allow other category properties for editing
	[key: string]: any;
}

export const addCategoryStore = writable<AddCategoryState>({});
