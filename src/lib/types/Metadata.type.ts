export type Metadata = {
	url: string;
	domain: string;
	title: string;
	description: string | null;
	summary: string | null; // AI-generated summary
	author: string | null;
	contentText: string | null;
	contentHtml: string | null;
	contentType: string | null;
	contentPublishedDate: string | null;
	mainImageUrl: string | null;
	iconUrl: string | null;
};
