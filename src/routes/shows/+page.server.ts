import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ locals }) {};

async function getRepoFiles(owner, repo, path = '') {
	const token = 'your_personal_access_token'; // Replace with your personal access token
	const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

	const response = await fetch(url, {
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
