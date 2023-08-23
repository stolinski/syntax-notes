import { SHOW_REPO_URL } from '$lib/constants';

export async function get_repo_files(token: string) {
	// const draft_response = await fetch(SHOW_REPO_URL + '/drafts', {
	// 	headers: {
	// 		Authorization: `token ${token}`,
	// 		Accept: 'application/vnd.github+json'
	// 	}
	// });

	const response = await fetch(SHOW_REPO_URL, {
		headers: {
			Authorization: `token ${token}`,
			Accept: 'application/vnd.github+json'
		}
	});

	if (!response.ok) {
		throw new Error(`Error fetching repository content: ${response.status}`);
	}

	const data = await response.json();
	return data;
}
