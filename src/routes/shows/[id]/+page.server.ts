import { get_repo_file } from '$lib/get_repo_file';
import { SHOW_REPO_URL } from '$lib/constants';
import type { Actions, PageServerLoad } from './$types';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import highlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import matter from 'gray-matter';
import { fail, json } from '@sveltejs/kit';

const owner = 'stolinski';
const repo = 'syntax-notes';
const baseBranch = 'main';

export const load: PageServerLoad = async function ({ locals, cookies, params }) {
	const oauth_token = cookies.get('oauth');
	const { id } = params;
	const url = `https://api.github.com/repos/${owner}/${repo}/contents/src/shows/${id}`;
	const response = await fetch(url, {
		headers: {
			Authorization: `token ${oauth_token}`,
			'Cache-Control': 'no-cache'
		}
	});
	const json = await response.json();
	const cont = atob(json.content); // Decode base64 content
	console.log('cont', cont);

	const { data, content } = matter(cont);

	const body_excerpt = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(highlight)
		.use(rehypeStringify)
		.process(content || '');

	return {
		notes: body_excerpt.toString(),
		meta: data,
		raw: cont,
		raw_notes: content,
		path: id
	};
};

export const actions: Actions = {
	publish: async (event) => {},
	draft: async ({ request, cookies }) => {
		const oauth_token = cookies.get('oauth');
		const { markdown_to_server, path } = await request.json();

		// Check if the path already ends with .draft.md
		const isDraft = path.endsWith('.draft.md');
		const draftPath = isDraft ? path : path.replace('.md', '.draft.md');

		// Check if the file already exists (if it's a draft)
		let sha;
		if (isDraft) {
			const existingFileResponse = await fetch(
				`https://api.github.com/repos/${owner}/${repo}/contents/src/shows/${draftPath}`,
				{
					headers: { Authorization: `token ${oauth_token}` }
				}
			);
			if (existingFileResponse.status === 200) {
				const existingFile = await existingFileResponse.json();
				sha = existingFile.sha; // Get the SHA if the file exists
			}
		}
		console.log('sha', sha);

		// Create or update the file with a .draft.md suffix
		const createOrUpdateFileResponse = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/contents/src/shows/${draftPath}`,
			{
				method: 'PUT',
				headers: { Authorization: `token ${oauth_token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: isDraft ? `Update ${draftPath}` : `Create ${draftPath}`,
					content: Buffer.from(markdown_to_server).toString('base64'),
					branch: baseBranch, // Using the same branch as the original file
					sha: sha // Include the SHA if updating
				})
			}
		);
		console.log('createOrUpdateFileResponse', createOrUpdateFileResponse);
		const ressss = await createOrUpdateFileResponse.json();
		console.log('ressss', ressss);

		if (createOrUpdateFileResponse.status >= 200 && createOrUpdateFileResponse.status < 300) {
			return { success: true };
		} else {
			return fail(createOrUpdateFileResponse.status);
		}
	}
};
